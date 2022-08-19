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
import { firestore } from '../../services/api/fbConfig';

function LatePayment(props) {
    const { late, firebase } = props;

    const [dash, setDash] = useState({});
    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);
    const [done1, setDone1] = useState(false);
    const [done3, setDone3] = useState(false);
    const [done4, setDone4] = useState(false);
    const [error, setError] = useState(false);
    const [errM, setErrM] = useState('');
    const [disable, setDisable] = useState(false);
    const [name, setName] = useState('');
    const [allChecked, setAllChecked] = useState(false);
    const [pendChecked, setPendChecked] = useState({});
    let __user__ = localStorage.getItem('name');
    __user__ = __user__ !== null ? __user__.toUpperCase() : '';

    // undo write events to database
    const rollBack = () => {
        for (const [key, value] of Object.entries(pendChecked)) {
            if (value) {
                firestore.collection("pending_transactions").doc(key)
                    .get().then(async (doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        const category = data.category;
                        if (category === 'deadSick') {
                            // also delete image
                            const fileName = data.file_name;
                            const storage = firebase.storage();
                            const storageRef = storage.ref();
                            const imageRef = storageRef.child(`dead_sick/${fileName}`);
                            await imageRef.delete();
                            console.log(fileName, "deleted");
                        }
                        await doc.ref.delete();
                    } else {
                        const err = new Error("Invalid data!");
                        setOpen(false);
                        setErrM("The reference no longer exists, it probably didn't have a clean EXIT_DEL instruction");
                        setError(true);
                        throw err;
                    }
                });
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
        const submit = document.getElementById(`rewind`);
        submit.disabled = true;
        rollBack();
        setOpen(true);
    }

    const isRejected = (date) => {
        if (date) {
            const today = new Date().getTime();
            let toMine = new Date(date);
            toMine.setHours(3, 0, 0, 0);
            // if mine time is < submittedOn then choose next date, else choose today
            if (toMine.getTime() < date.getTime()) {
                toMine.setDate(toMine.getDate()+1);
            }
            return toMine.getTime() < today;
        } else {
            return false;
        }
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
                            <h4 className="card-title">Pending Transactions</h4>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                    <tr>
                                        <th>
                                            <div className="form-check form-check-muted m-0">
                                                <label className="form-check-label">
                                                    <input
                                                        disabled={disable}
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
                                                <td> {sanitize_string(item.values?.category, item.values?.buyerName || item.values?.itemName)} </td>
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
                <button type="button" disabled={false} className="btn btn-primary" onClick={display} id='rewind'>
                    Rewind
                </button>
                <Online>
                    <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity="success">
                            Accepted. Pending Transactions will be rewinded
                        </Alert>
                    </Snackbar>
                    <Snackbar open={error} autoHideDuration={5000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity="danger">
                            {errM}
                        </Alert>
                    </Snackbar>
                </Online>
                <Offline>
                    <Snackbar
                        open={open} autoHideDuration={5000}
                        onClose={handleClose}
                        key={'topcenter'}>
                        <Alert onClose={handleClose} severity="warning">
                            Accepted. Rewinding will happen when back online
                        </Alert>
                    </Snackbar>
                    <Snackbar
                        open={error} autoHideDuration={5000}
                        onClose={handleClose}>
                        <Alert onClose={handleClose} severity="danger">
                            {errM}
                        </Alert>
                    </Snackbar>
                </Offline>
            </div>
        </div>
    );
}

const mapStateToProps = function(state) {
    return {
        late: state.firestore.ordered.late_payment
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'late_payment', orderBy: ['submittedOn', 'desc']},
    ])
)(LatePayment);
