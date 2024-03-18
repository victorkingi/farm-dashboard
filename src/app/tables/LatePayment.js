import React, { useEffect, useMemo, useState } from 'react';
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


function LatePayment(props) {
    const { late } = props;

    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const [errM, setErrM] = useState('');
    const [allChecked, setAllChecked] = useState(false);
    const [pendChecked, setPendChecked] = useState({});
    const [total, setTotal] = useState(0);
    const [fullAmount, setFullAmount] = useState(0);

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

    useEffect(() => {
        let resPend = Object.values(pendChecked).filter(x => x[0] === true && x[1] === "1");
        resPend = resPend.reduce((acc, cur) => acc + cur[4], 0);
        setTotal(resPend);
    }, [pendChecked]);

    useEffect(() => {
        if (!late) return 0;
        let amount = 0;
        for (let i = 0; i < late.length; i++) {
            if (late[i].values.col_id === "1")
                amount += parseInt(late[i].values.price) * parseInt(late[i].values.units);
        }
        setFullAmount(amount);
    }, [late]);

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
                late[i].values.col_id,
                late[i].values?.extra_data?.vendor ? `${late[i].values?.item_name}(${late[i].values?.extra_data?.vendor})` : (late[i].values?.item_name || late[i].values?.buyer),
                description,
                parseInt(late[i].values.price) * parseInt(late[i].values.units)
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
                            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                                <h6>Total owed from sales Ksh. {numeral(fullAmount).format("0,0")}</h6>
                            </div>
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
                                    {late && Array(...late).map((item) => {
                                        return (
                                            <tr key={item.id.slice(0,5)} className={`text-${(item.hasOwnProperty('rejected') && item.hasOwnProperty('ready')) ? 'white' : 'muted'}`}>
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
                                                <td className="text-success">{item.values?.col_id === '2' ? 'P' : 'S'}</td>
                                                <td>({moment(item.values?.date?.toDate()).format("MMM Do YY")})<br/>{sanitize_string(item.values)} {`${numeral(item.values?.units).format('0,0')}@${numeral(item.values?.price).format('0,0')}`}</td>
                                                <td>
                                                    {(item?.rejected > 0 && item?.signal === 1)
                                                        ? <div className="badge badge-outline-danger">Rejected</div>
                                                        : (item?.rejected > 0 && item?.signal === 2)
                                                            ? <div className="badge badge-outline-light">Rejected</div>
                                                            : item?.ready === true ? <div className="badge badge-outline-success">Ready</div>
                                                                : (item?.rejected === 0 && item?.ready === false ? <div className="badge badge-outline-info">Skipped</div>
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
                        <div className="col">
                            <p>*About to clear sales of <b>Ksh. {numeral(total).format("0,0")}</b></p>
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
            collection: '0',
            doc: 'misc',
            subcollections: [
                {collection: 'pending', where: ['values.check_group', '==', '1'], orderBy: ['values.date', 'desc']}
            ],
            storeAs: 'ppending'
        }
    ])
)(LatePayment);
