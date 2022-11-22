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
    const { late, extra } = props;

    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const [errM, setErrM] = useState('');
    const [allChecked, setAllChecked] = useState(false);
    const [pendChecked, setPendChecked] = useState({});
    const [payers, setPayers] = useState('');
    const [clearWay, setClearWay] = useState('');
    const [bpresets, setBpresets] = useState({});
    const [chosenPreset, setChosenPreset] = useState('Pairing options');

    useEffect(() => {
        if (extra) {
            setBpresets(extra.extra_data.balance_out);
        }
    }, [extra]);

    // undo write events to database
    const latePaid = async (isOne, isDebt, buyers, items) => {
        const allKeys = [];

        for (const [key, val] of Object.entries(pendChecked)) {
            const value = val[0];
            if (value) allKeys.push(key);
        }
        const res = await props.hasPaidLate(allKeys, isOne, isDebt, buyers, items, payers);
        const errors = res.filter(x => x !== 'ok');
        if (errors.length !== 0) {
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

    useEffect(() => {
        const submit = document.getElementById(`latereceived`);

        if (clearWay === 'Available Balance') {
            let foundSale = false;
            let foundBuy = false;
            let totalSections = new Set();

            for (const x of Object.values(pendChecked)) {
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
                submit.disabled = true;
                return;
            }

            if (totalSections.size > 1) {
                setErrM("Selected entries should be of the same buyer or purchased item");
                setClearWay('');
                setError(true);
                submit.disabled = true;
                return;
            }
            setError(false);
            submit.disabled = false;
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

        if (JSON.stringify(pendChecked) === '{}') {
            setOpen(false);
            setErrM("Select at least one entry");
            setError(true);
            return 0;
        }

        if (clearWay === '') {
            setOpen(false);
            setErrM("Choose clear method");
            setError(true);
            return 0;
        } else if (clearWay === 'Available Balance') {
            const regexCheck = /^(([a-z]|[A-Z])+:[0-9]+,)*$/;

            if (!regexCheck.test(payers)) {
                setOpen(false);
                setErrM("Payee should be in this format [name:amount,]");
                setError(true);
                return 0;
            }
            let x_ = payers.slice(0, -1);
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
            let i = 0;
            for (const entry of Object.values(pendChecked)) {
                if (entry[0] === false) continue;
                expectedTotal += entry[4];
                i++;
            }

            const submit = document.getElementById(`latereceived`);
            submit.disabled = true;

            // if only one entry selected, it can be half paid
            if (i === 1) {
                if (expectedTotal < totalAmount) {
                    setOpen(false);
                    setErrM(`Expected a total payment or less of Ksh.${numeral(expectedTotal).format('0,0')} but got Ksh.${numeral(totalAmount).format('0,0')}`);
                    setError(true);
                    return 0;
                }
                latePaid(true, false, [], []);
            } else {
                if (expectedTotal !== totalAmount) {
                    setOpen(false);
                    setErrM(`Expected a total payment of Ksh.${numeral(expectedTotal).format('0,0')} but got Ksh.${numeral(totalAmount).format('0,0')}`);
                    setError(true);
                    return 0;
                }
                latePaid(false, false, [], []);
            }

        } else if (clearWay === 'Debt Balance') {
            for (const x of Object.values(bpresets)) {
                const preset = `${x.buyers.join(',')} -> ${x.items.join(',')}`;

                if (preset === chosenPreset) {
                    for (const entry of Object.values(pendChecked)) {
                        if (!entry[0]) continue;

                        const tempBuyers = x.buyers.map(k => k.toUpperCase());
                        const tempItems = x.items.map(k => k.toUpperCase());

                        if (!tempBuyers.concat(tempItems).includes(entry[2].toUpperCase())) {
                            setOpen(false);
                            setErrM(`Got ${entry[2].toLowerCase()} but expected one of ${preset}`);
                            setError(true);
                            return 0;
                        }
                    }

                    const submit = document.getElementById(`latereceived`);
                    submit.disabled = true;
                    latePaid(true, true, x.buyers, x.items);
                    return 0;
                }
            }
            setOpen(false);
            setErrM(`Choose a pairing from the options`);
            setError(true);
            return 0;
        }
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
                late[i].values?.vendorName ? `${late[i].values?.itemName}(${late[i].values?.vendorName})` : (late[i].values?.itemName || late[i].values?.buyerName),
                description,
                late[i].values?.objectPrice ? (parseInt(late[i].values.objectPrice) * parseInt(late[i].values.objectNo)) : (parseInt(late[i].values.trayPrice) * parseInt(late[i].values.trayNo))
            ];
        }
        setPendChecked(allPend);
    }

    const handleChange = (e) => {
        setPayers(e.target.value);
    }

    const handleClearWay = (e) => {
        setClearWay(e);
    }

    const handlePreset = (e) => {
        setChosenPreset(e);
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
                                                                           item.values?.vendorName ? `${item.values?.itemName}(${item.values?.vendorName})` : (item.values?.itemName || item.values?.buyerName),
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
                                        {clearWay === 'Debt Balance' &&
                                            <Form.Group>
                                                <label htmlFor='section'>Choose pairing</label>
                                                <DropdownButton
                                                    alignRight
                                                    title={chosenPreset}
                                                    onSelect={handlePreset}
                                                >
                                                    {Object.values(bpresets).map((item) => {
                                                        const preset = `${item.buyers.join(',')} -> ${item.items.join(',')}`;
                                                        return <div key={preset}><Dropdown.Item eventKey={preset}>{preset}</Dropdown.Item></div>
                                                    })}
                                                </DropdownButton>
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
        late: state.firestore.ordered.late_payment,
        extra: state.firestore.data.extra_data
    }
}
const mapDispatchToProps = (dispatch) => {
    return {
        hasPaidLate: (allKeys, isOne, isDebt, buyers, items, payers) => dispatch(hasPaidLate(allKeys, isOne, isDebt, buyers, items, payers))
    }
}


export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
        {collection: 'late_payment', orderBy: ['values.date', 'desc']},
        {collection: 'extra_data', doc: 'extra_data'}
    ])
)(LatePayment);
