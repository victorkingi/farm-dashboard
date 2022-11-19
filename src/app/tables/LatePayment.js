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

const users = ['BANK', 'JEFF', 'VICTOR', 'BABRA', 'PURITY', 'ANNE'];

const getAmountLeft = (values) => {
    let amountPaid = 0;
    let total = 0;

    if (values.hasOwnProperty('receiver')) {
        total = parseInt(values.trayNo) * parseInt(values.trayPrice);

        if (values.receiver !== '') {
            let paid = values.receiver.slice(0, -1).split(',');
            for (let x of paid) {
                amountPaid += parseInt(x.split(':')[1]);
            }
        }
    }

    if (values.hasOwnProperty('paid_by')) {
        total = parseInt(values.objectNo) * parseInt(values.objectPrice);

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
    const [payers, setPayers] = useState({});
    const [clearWay, setClearWay] = useState('');

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

    useEffect(() => {
        if (clearWay === 'Available Balance') {
            let foundSale = false;
            let foundBuy = false;
            let totalSections = new Set();

            for (const x of Object.values(pendChecked)) {
                console.log(x);
                if (x[0] === false) continue;
                if (x[1] === 'sales') foundSale = true;
                else if (x[1] === 'buys') foundBuy = true;
                totalSections.add(x[2]);
                if (foundSale && foundBuy) break;
            }

            if (foundBuy && foundSale) {
                setErrM("Untick all purchases or all sales. Cannot mix sales and purchases if clearing by available balance");
                setClearWay('');
                setError(true);
                return;
            }

            if (totalSections.size !== 1) {
                setErrM("Selected entries should be of the same buyer or purchased item");
                setClearWay('');
                setError(true);
                return;
            }
            setError(false);
        }
    }, [clearWay, pendChecked]);

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
        if (clearWay === '') {
            setOpen(false);
            setErrM("Choose clear method");
            setError(true);
            return 0;
        }

        const regexCheck = /^(([a-z]|[A-Z])+:[0-9]+,)*$/;

        for (const [, x] of Object.entries(payers)) {
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
            let expectedTotal = 0;
            for (const entry of Object.values(pendChecked)) {
                if (entry[0] === false) continue;
                expectedTotal += entry[4];
            }

            if (expectedTotal !== totalAmount) {
                setOpen(false);
                setErrM(`Expected a total payment of Ksh.${numeral(expectedTotal).format('0,0')} but got Ksh.${numeral(totalAmount).format('0,0')}`);
                setError(true);
                return 0;
            }
        }

        //const submit = document.getElementById(`latereceived`);
        //submit.disabled = true;
        //latePaid();
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
                late[i].values?.itemName || late[i].values?.buyerName,
                description,
                late[i].values?.objectPrice ? (parseInt(late[i].values.objectPrice) * parseInt(late[i].values.objectNo)) : (parseInt(late[i].values.trayPrice) * parseInt(late[i].values.trayNo))
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

    const handleClearWay = (e) => {
        setClearWay(e);
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
                                        <th> Date </th>
                                        <th> Status </th>
                                        <th> Amount left </th>
                                        <th> Total </th>
                                        <th> Type </th>
                                        <th> Name </th>
                                        <th> Payees/Receivers </th>
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
                                                                           item.values.itemName || item.values.buyerName,
                                                                           sanitize_string(item.values)
                                                                           +` ${numeral(item.values?.trayNo 
                                                                               || item.values?.objectNo)
                                                                               .format('0,0')}@${numeral(item.values?.trayPrice 
                                                                               || item.values?.objectPrice)
                                                                               .format('0,0')} on ${moment(item.values.date.toDate()).format("MMM Do YY")}`,
                                                                           item.values?.objectPrice ? (parseInt(item.values.objectPrice) * parseInt(item.values.objectNo)) : (parseInt(item.values?.trayNo) * parseInt(item.values?.trayPrice))
                                                                       ]})}
                                                                   id={item.id} name={item.id}
                                                            />
                                                            <i className="input-helper"/>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                                                <td>
                                                    {(item?.rejected === true && item?.signal !== 1)
                                                        ? <div className="badge badge-outline-danger">Rejected</div>
                                                        : (item?.rejected === true && item?.signal === 1)
                                                            ? <div className="badge badge-outline-light">Rejected</div>
                                                            : (item?.ready === true ? <div className="badge badge-outline-success">Pending</div>
                                                                : <div className="badge badge-outline-primary">Waiting</div>)}
                                                </td>
                                                <td>{numeral(getAmountLeft(item.values)[1]).format('0,0')}</td>
                                                <td>{numeral(getAmountLeft(item.values)[0]).format('0,0')}</td>
                                                <td className="text-success"> {item.values?.category === 'buys' ? 'P' : 'S'}</td>
                                                <td> {sanitize_string(item.values)} {`${numeral(item.values?.trayNo || item.values?.objectNo).format('0,0')}@${numeral(item.values?.trayPrice || item.values?.objectPrice).format('0,0')}`} </td>
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
                {JSON.stringify(pendChecked) !== '{}' &&
                        <div className='col-xl grid-margin stretch-card'>
                            <div className='card'>
                                <div className='card-body'>
                                    <h4 className='card-title'>Clear Options</h4>
                                    <form className='forms-sample'>
                                        <Form.Group>
                                            <label htmlFor='section'>Clear By</label>
                                            <DropdownButton
                                                alignRight
                                                title={clearWay}
                                                onSelect={handleClearWay}
                                            >
                                                <Dropdown.Item eventKey="">Choose clearing method</Dropdown.Item>
                                                <Dropdown.Item eventKey="Available Balance">Available Balance</Dropdown.Item>
                                                <Dropdown.Item eventKey="Debt Balance">Debt Balance</Dropdown.Item>
                                            </DropdownButton>
                                        </Form.Group>
                                        {clearWay === 'Available Balance' &&
                                            <Form.Group>
                                                <label htmlFor='payers'>Input the user who will receive the funds or who will pay for the purchase</label>
                                                <Form.Control
                                                    type='text'
                                                    onChange={handleChange}
                                                    className='form-control text-white'
                                                    id='payers'
                                                    placeholder='Input format is [name:amount,]'
                                                />
                                            </Form.Group>
                                        }
                                    </form>
                                </div>
                            </div>
                        </div>
                }
            </div>
            <button type="button" disabled={false} className="btn btn-primary ro" onClick={display} id='latereceived'>
                Submit
            </button>
            <Online>
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        Entries updated. Will be moved if full payment was made
                    </Alert>
                </Snackbar>
            </Online>
            <Offline>
                <Snackbar
                    open={open} autoHideDuration={5000}
                    onClose={handleClose}
                    key={'topcenter'}>
                    <Alert onClose={handleClose} severity="warning">
                        Entries updated. Will be moved when back online if full payment was made
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
