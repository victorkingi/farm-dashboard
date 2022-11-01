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
import {Form} from "react-bootstrap";

const users = ['BANK', 'JEFF', 'VICTOR', 'BABRA', 'PURITY', 'ANNE'];

function LatePayment(props) {
    const { late } = props;

    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const [errM, setErrM] = useState('');
    const [allChecked, setAllChecked] = useState(false);
    const [pendChecked, setPendChecked] = useState({});
    const [payers, setPayers] = useState({});

    // undo write events to database
    const latePaid = async () => {

        for (const [key, val] of Object.entries(pendChecked)) {
            const value = val[0];
            if (value) {
                let payerNames = payers[`${key}payers`];
                if (val[1] === 'buys' && !payerNames) {
                    payerNames = `BANK:${val[3]},`
                }

                const res = await props.hasPaidLate(key, payerNames);
                if (res !== 'ok') {
                    setOpen(false);
                    setErrM("Entry no longer exists");
                    setError(true);
                    return 0;
                }
            }
        }
        setError(false);
        setOpen(true);
        setAllChecked(false);
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
        const regexCheck = /^(([a-z]|[A-Z])+:[0-9]+,)*$/;

        for (const [key, x] of Object.entries(payers)) {
            if (!regexCheck.test(x)) {
                setOpen(false);
                setErrM("Payee should be in this format [name:amount,]");
                setError(true);
                return 0;
            }
            let x_ = x.slice(0, -1);
            let payerNames_ = x_.split(',');
            let payerNames = [];
            for (const n of payerNames_) {
                payerNames.push(n.split(':')[0]);
            }

            for (const name_ of payerNames) {
                if (!users.includes(name_.toUpperCase())) {
                    setOpen(false);
                    setErrM("Invalid payer provided");
                    setError(true);
                    return 0;
                }
            }

            let totalAmount = 0;
            for (const amt of payerNames_) {
                totalAmount += parseInt(amt.split(':')[1]);
            }
            if (!late) {
                setOpen(false);
                setErrM("late entries not loaded");
                setError(true);
                return 0;
            }
            const tempLate = [...late];
            let expectedTotal = tempLate.filter(x => x.id === key.split('payers')[0]);
            expectedTotal = parseInt(expectedTotal[0].values.objectPrice) * parseInt(expectedTotal[0].values.objectNo);

            if (expectedTotal !== totalAmount) {
                setOpen(false);
                setErrM(`Expected a total payment of Ksh.${numeral(expectedTotal).format('0,0')} but got Ksh.${numeral(totalAmount).format('0,0')}`);
                setError(true);
                return 0;
            }
        }

        const submit = document.getElementById(`latereceived`);
        submit.disabled = true;
        latePaid();
    }

    const addAllEntries = (all) => {
        if (!late) return 0;
        const allPend = {};
        for (let i = 0; i < late.length; i++) {
            if (late[i].values.section === 'CAKES') continue;
            const description = sanitize_string(late[i].values)
                +` ${numeral(late[i].values?.trayNo || late[i].values?.objectNo)
                    .format('0,0')}@${numeral(late[i].values?.trayPrice || late[i].values?.objectPrice)
                    .format('0,0')} on ${moment(late[i].values.date.toDate()).format("MMM Do YY")}`;

            allPend[late[i].id] = [
                all,
                late[i].values.category,
                description,
                late[i].values?.objectPrice ? (late[i].values.objectPrice * late[i].values.objectNo) : -1
            ];
        }
        setPendChecked(allPend);
    }

    const handleChange = (e) => {
        setPayers({
            ...payers,
            [e.target.id]: e.target.value
        });
    }

    return (
        <div>
            <div className="row ">
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
                                        <th> Date </th>
                                        <th> Type </th>
                                        <th> Name </th>
                                        <th> Amount </th>
                                        <th> Receiver </th>
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
                                                                   checked={pendChecked[item.id] ? pendChecked[item.id][0] : false}
                                                                   onChange={() => setPendChecked({...pendChecked,
                                                                       [item.id]: [
                                                                           !pendChecked[item.id],
                                                                           item.values.category,
                                                                           sanitize_string(item.values)
                                                                           +` ${numeral(item.values?.trayNo 
                                                                               || item.values?.objectNo)
                                                                               .format('0,0')}@${numeral(item.values?.trayPrice 
                                                                               || item.values?.objectPrice)
                                                                               .format('0,0')} on ${moment(item.values.date.toDate()).format("MMM Do YY")}`,
                                                                           item.values?.objectPrice ? (item.values.objectPrice * item.values.objectNo) : -1
                                                                       ]})}
                                                                   id={item.id} name={item.id}
                                                            />
                                                            <i className="input-helper"/>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                                                <td className="text-success"> {item.values?.category === 'buys' ? 'P' : 'S'}</td>
                                                <td> {sanitize_string(item.values)} {`${numeral(item.values?.trayNo || item.values?.objectNo).format('0,0')}@${numeral(item.values?.trayPrice || item.values?.objectPrice).format('0,0')}`} </td>
                                                <td> {numeral(parseFloat(getAmount(item))).format("0,0")} </td>
                                                <td> {item.values.receiver?.toLowerCase() || 'N/A'} </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                {Object.entries(pendChecked).map(x => {
                    if (x[1][1] !== 'buys') return '';

                    return (
                        <div key={x[0]} className='col-xl grid-margin stretch-card'>
                            <div className='card'>
                            <div className='card-body'>
                                <h4 className='card-title'>{}</h4>
                                <form className='forms-sample'>
                                    <Form.Group>
                                        <label htmlFor={`${x[0]}payers`}>Purchases of {x[1][2]} paid by(Optional)</label>
                                        <p className="text-primary">*Default payer is bank</p>
                                        <p className="text-primary">*Valid payers are {users.map(x => x.charAt(0)+x.slice(1).toLowerCase()).join(', ')}</p>
                                        <Form.Control
                                            type='text'
                                            onChange={handleChange}
                                            className='form-control text-white'
                                            id={`${x[0]}payers`}
                                            placeholder='Input payers and amount in this format "name:amount,"'
                                            value={payers[x[0]]}
                                        />
                                    </Form.Group>
                                </form>
                            </div>
                        </div>
                        </div>
                    )
                })}
                <button type="button" disabled={false} className="btn btn-primary" onClick={display} id='latereceived'>
                    Cleared
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
        hasPaidLate: (details, payers) => dispatch(hasPaidLate(details, payers))
    }
}


export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
        {collection: 'late_payment', orderBy: ['values.date', 'desc']},
    ])
)(LatePayment);
