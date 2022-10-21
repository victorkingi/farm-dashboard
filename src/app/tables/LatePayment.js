import React, { useMemo, useState } from 'react';
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

    // undo write events to database
    const latePaid = async () => {
        for (const [key, value] of Object.entries(pendChecked)) {
            if (value) {
                const res = await props.hasPaidLate(key);
                if (res === 'ok') {
                    setError(false);
                    setOpen(true);
                    setAllChecked(false);
                } else {
                    setOpen(false);
                    setErrM("Entry no longer exists");
                    setError(true);
                    return 0;
                }
            }
        }
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

    const getAmount = (item) => {
        if (item?.values?.trayNo)
            return parseInt(item?.values?.trayNo)
                * parseFloat(item?.values?.trayPrice);
        else if (item?.values?.objectNo)
            return  parseInt(item?.values?.objectNo)
                * parseFloat(item?.values?.objectPrice);
        else if (item?.values?.amount) return item?.values?.amount;
    }

    const display = (e) => {
        e.preventDefault();
        const submit = document.getElementById(`latereceived`);
        submit.disabled = true;
        latePaid();
    }

    const addAllEntries = (all) => {
        if (!late) return 0;
        const allPend = {};
        for (let i = 0; i < late.length; i++) {
            if (late[i].values.section === 'CAKES') continue;
            allPend[late[i].id] = all;
        }
        setPendChecked(allPend);
    }

    return (
        <div>
            <div className="row ">
                <div className="col-12 grid-margin">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Late Payments</h4>
                            <div className="table-responsive">
                                <table className="table">
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
                                        <th> Date </th>
                                        <th> Name </th>
                                        <th> From </th>
                                        <th> To </th>
                                        <th> Amount </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {late && late.map((item) => {
                                        if (item.values?.section === 'CAKES') return '';
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="form-check form-check-muted m-0">
                                                        <label className="form-check-label">
                                                            <input type="checkbox"
                                                                   className="form-check-input" defaultValue={0}
                                                                   checked={pendChecked[item.id]}
                                                                   onChange={() => setPendChecked({...pendChecked,
                                                                       [item.id]: !pendChecked[item.id]})}
                                                                   id={item.id} name={item.id}
                                                            />
                                                            <i className="input-helper"/>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                                                <td> {sanitize_string(item.values)} {`${numeral(item.values?.trayNo || item.values?.objectNo).format('0,0')}@${numeral(item.values?.trayPrice || item.values?.objectPrice).format('0,0')}`} </td>
                                                <td>{(item.values?.category !== 'sales' && item.values?.category !== 'buys' && (item.values.name ? item.values?.name.charAt(0)+item.values?.name.slice(1).toLowerCase() : item.values?.borrower.charAt(0)+item.values?.borrower.slice(1).toLowerCase())) || 'Miner'}</td>
                                                <td>{item.values?.receiver ? item.values?.receiver.charAt(0)+item.values?.receiver.slice(1).toLowerCase() : item.values?.name.charAt(0)+item.values?.name.slice(1).toLowerCase()}</td>
                                                <td> {numeral(parseFloat(getAmount(item))).format("0,0")} </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <button type="button" disabled={false} className="btn btn-primary" onClick={display} id='latereceived'>
                    Payment Received
                </button>
                <Online>
                    <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity="success">
                            Accepted and moved
                        </Alert>
                    </Snackbar>
                </Online>
                <Offline>
                    <Snackbar
                        open={open} autoHideDuration={5000}
                        onClose={handleClose}
                        key={'topcenter'}>
                        <Alert onClose={handleClose} severity="warning">
                            Accepted. Will be moved when back online
                        </Alert>
                    </Snackbar>
                </Offline>
                <Snackbar open={error} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="error">
                        {errM}
                    </Alert>
                </Snackbar>
            </div>
        </div>
    );
}

const mapStateToProps = function(state) {
    return {
        late: state.firestore.ordered.late_payment
    }
}
const mapDispatchToProps = (dispatch) => {
    return {
        hasPaidLate: (details) => dispatch(hasPaidLate(details))
    }
}


export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
        {collection: 'late_payment', orderBy: ['submittedOn', 'desc']},
    ])
)(LatePayment);
