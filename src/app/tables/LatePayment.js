import React, { useMemo, useState, useEffect } from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import numeral from 'numeral';
import moment from 'moment';
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from '../form-elements/InputEggs';
import {sanitize_string} from "../../services/actions/utilAction";
import {Redirect} from "react-router-dom";
import {Offline, Online} from "react-detect-offline";
import {hasPaidLate} from "../../services/actions/moneyAction";
import {Form} from "react-bootstrap";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";

const getAmountLeft = (values) => {
    let amountPaid = 0;
    let total = 0;

    if (values.hasOwnProperty('receiver')) {
        total = parseInt(values.units) * parseInt(values.price);

        if (values.receiver !== '') {
            let paid = values.receiver.slice(0, -1).split(',');
            for (let x of paid) {
                amountPaid += parseInt(x.split(':')[1]);
            }
        }
    }

    if (values.hasOwnProperty('paid_by')) {
        total = parseInt(values.units) * parseInt(values.price);

        if (values.paid_by !== '') {
            let paid = values.paid_by.slice(0, -1).split(',');
            for (let x of paid) {
                amountPaid += parseInt(x.split(':')[1]);
            }
        }
    }
    return [total, total - amountPaid];
}

function LatePayment(props) {
    const { late } = props;

    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const [errM, setErrM] = useState('');
    const [allChecked, setAllChecked] = useState(false);
    const [pendChecked, setPendChecked] = useState({});

    // undo write events to database
    const latePaid = async () => {
        const allKeys = [];

        for (const [key, val] of Object.entries(pendChecked)) {
            const value = val[0];
            if (value) allKeys.push(key);
        }
        const res = await props.hasPaidLate(allKeys);
        console.log("RESS", res);

        const errors = res.filter(x => x !== 'ok');
        if (errors.length !== 0 || allKeys.length !== res.length) {
            console.log(res);
            setOpen(false);
            setErrM(errors[0]);
            setError(true);
            return 0;
        }
        setError(false);
        setOpen(true);
        setAllChecked(false);
        setPendChecked({});
    }

    const user = useMemo(() => {
        const __user = localStorage.getItem('user') || false;

        return {__user};
    }, []);

    if (!user.__user) {
        return (
            <Redirect to="/user-pages/login-1"/>
        )
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setError(false);
        setErrM('');
        setOpen(false);
    };

    const display = (e) => {
        e.preventDefault();

        if (JSON.stringify(pendChecked) === '{}') {
            setOpen(false);
            setErrM("Select at least one entry");
            setError(true);
            return 0;
        }

        latePaid();
    }

    const addAllEntries = (all) => {
        if (!late) return 0;
        const allPend = {};
        for (let i = 0; i < late.length; i++) {
            const description = sanitize_string(late[i].values)
                +` ${numeral(late[i].values?.units || late[i].values?.units)
                    .format('0,0')}@${numeral(late[i].values?.price || late[i].values?.price)
                    .format('0,0')} on ${moment(late[i].values.date.toDate()).format("MMM Do YY")}`;

            allPend[late[i].id] = [
                all,
                late[i].values.category,
                late[i].values?.extra_data?.vendor ? `${late[i].values?.item_name}(${late[i].values?.extra_data?.vendor})` : (late[i].values?.item_name || late[i].values?.buyer),
                description,
                late[i].values?.price ? (parseInt(late[i].values.price) * parseInt(late[i].values.units)) : (parseInt(late[i].values.price) * parseInt(late[i].values.units))
            ];
        }
        setPendChecked(allPend);
    }

    return (
        <div>
            <div className="row">
                <div className="col-12 grid-margin">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Late Payments</h4>
                            <div className="table-responsive">
                                <table className="table text-white">
                                    <thead>
                                    <tr>
                                        <th>
                                            <div className="form-check form-check-muted m-0">
                                                <label className="form-check-label">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        defaultValue={0}
                                                        onChange={() => {
                                                            setAllChecked(!allChecked);
                                                            addAllEntries(!allChecked);
                                                        }}
                                                        checked={allChecked}
                                                        id="pending"
                                                        name="pending"
                                                    />
                                                    <i className="input-helper"/>
                                                </label>
                                            </div>
                                        </th>
                                        <th>Type</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {late && Array(...late).sort((a, b) => b.values.date.toDate() - a.values.date.toDate()).map((item) => {
                                        return (
                                            <tr key={item.id.slice(0,5)} className={`text-${(item.hasOwnProperty('rejected') && item.hasOwnProperty('ready') && item.rejected !== item.ready) ? 'white' : 'muted'}`}>
                                                <td>
                                                    <div className="form-check form-check-muted m-0">
                                                        <label className="form-check-label">
                                                            <input type="checkbox"
                                                                   className="form-check-input" defaultValue={0}
                                                                   checked={pendChecked[item.id] ? pendChecked[item.id][0] : false}
                                                                   onClick={() => setPendChecked({...pendChecked,
                                                                       [item.id]: [
                                                                           !(pendChecked[item.id] ? pendChecked[item.id][0] : false),
                                                                           item.values.col_id,
                                                                           item.values?.extra_data?.vendor ? `${item.values?.item_name}(${item.values?.extra_data?.vendor})` : (item.values?.item_name || item.values?.buyer),
                                                                           sanitize_string(item.values)
                                                                           +` ${numeral(item.values?.units)
                                                                               .format('0,0')}@${numeral(item.values?.price)
                                                                               .format('0,0')} on ${moment(item.values.date.toDate()).format("MMM Do YY")}`,
                                                                           parseInt(item.values.price) * parseInt(item.values.units)
                                                                       ]})}
                                                                   id={item.id} name={item.id}
                                                            />
                                                            <i className="input-helper"/>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="text-success">{item.values?.col_id === 2 ? 'P' : 'S'}</td>
                                                <td>({moment(item.values?.date?.toDate()).format("MMM Do YY")})<br/>{sanitize_string(item.values)} {`${numeral(item.values?.units).format('0,0')}@${numeral(item.values?.price).format('0,0')}`}</td>
                                                <td>
                                                    {(item?.rejected === true && item?.signal === 1)
                                                        ? <div className="badge badge-outline-danger">Rejected</div>
                                                        : (item?.rejected === true && item?.signal === 2)
                                                            ? <div className="badge badge-outline-light">Rejected</div>
                                                            : item?.ready === true ? <div className="badge badge-outline-success">Ready</div>
                                                                : ((item?.ready === item?.rejected) && item?.ready === false ? <div className="badge badge-outline-info">Skipped</div>
                                                                : <div className="badge badge-outline-primary">Waiting</div>)}
                                                </td>
                                                <td>{numeral(parseInt(item.values.price) * parseInt(item.values.units)).format('0,0')}</td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button type="button" disabled={false} className="btn btn-primary ro" onClick={display} id='latereceived'>
                Cleared
            </button>
            <Online>
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        Entries updated
                    </Alert>
                </Snackbar>
            </Online>
            <Offline>
                <Snackbar
                    open={open} autoHideDuration={5000}
                    onClose={handleClose}
                    key={'topcenter'}>
                    <Alert onClose={handleClose} severity="warning">
                        Entries updated. Will be moved when back online
                    </Alert>
                </Snackbar>
            </Offline>
            <Snackbar open={error} autoHideDuration={5000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="error">
                    {errM}
                </Alert>
            </Snackbar>
        </div>
    );
}

const mapStateToProps = function(state) {
    return {
        late: state.firestore.ordered.ppending
    }
}
const mapDispatchToProps = (dispatch) => {
    return {
        hasPaidLate: (allKeys) => dispatch(hasPaidLate(allKeys))
    }
}


export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect(() => [
        {
            collection: 'farms',
            doc: '0',
            subcollections: [
                {collection: 'ppending'}
            ],
            storeAs: 'ppending'
        }
    ])
)(LatePayment);
