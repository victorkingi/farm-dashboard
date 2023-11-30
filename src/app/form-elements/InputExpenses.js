import React, {useEffect, useMemo, useState} from 'react';
import { Form } from 'react-bootstrap';
import {connect} from 'react-redux';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {inputExpense} from "../../services/actions/buyAction";
import {Offline, Online} from "react-detect-offline";
import {getSectionAddr} from "../../services/actions/salesAction";
import {firebase} from '../../services/api/fbConfig';
import {compose} from "redux";
import {firestoreConnect} from "react-redux-firebase";

function InputExpense(props) {
    const { extraData, dash } = props;

    const [state, setState] = useState({
        date: new Date(),
        section: 'Choose Section',
        item_no: '',
        item_price: '',
        item_name: '',
        vendor_name: '',
        category: 'expenses',
        paid_by: '',
        extra_data: ''
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [isFeeds, setIsFeeds] = useState(false);
    const [employeeNames, setEmployeeNames] = useState([]);
    const [feedsVendors, setFeedsVendors] = useState([]);
    const [feedsType, setFeedsType] = useState([]);
    const [groups, setGroups] = useState([]);
    const [parentNode, setParentNode] = useState('');

    let name = firebase.auth().currentUser?.displayName || '';
    name = name.substring(0, name.lastIndexOf(" ")).toUpperCase();

    useEffect(() => {
        if (extraData) {
            setEmployeeNames(extraData[0].pay_employees || []);
            setFeedsVendors(extraData[0].feeds_vendors || []);
            setFeedsType(extraData[0].feeds_type || []);
            
            let groups = extraData[0].subgroups || {};
            groups = Object.keys(groups).filter(
                key => key.split('::')[1] === '0').reduce(
                    (cur, key) => { return Object.assign(cur, { [key]: groups[key] })}, {});
            
            const val_groups = Object.values(groups);
            val_groups.push('all');
            setGroups(val_groups || []);
        }
        if (dash) {
            setParentNode(dash[0].raw?.parent || '');
        }
    }, [extraData, dash]);

    useEffect(() => {
        if (state.section === "Feeds") setIsFeeds(true);
        else setIsFeeds(false);
    }, [state.section]);

    const checkDate = (date) => {
        if (date.getTime() > new Date().getTime()) {
            setError('Invalid date');
            setOpenError(true);
            return false;
        } else {
            return true;
        }
    }

    const parameterChecks = (values) => {
        if (values.section === 'FEEDS') {
            const validVendors = feedsVendors.map(x => x.toUpperCase());
            const validFeeds = feedsType.map(x => x.toUpperCase());
            if (!values.vendor_name) {
                console.log("Vendor name cannot be empty");
                setError("Vendor name cannot be empty");
                setOpenError(true);
                return false;
            }
            values.vendor_name = values.vendor_name.toUpperCase();
            if (!validVendors.includes(values.vendor_name)) {
                console.log("invalid vendor name");
                setError("invalid vendor name");
                setOpenError(true);
                return false;
            }
            if (!validFeeds.includes(values.item_name.toUpperCase())) {
                setError("Invalid feeds item name. It can only be Layers, Chick, Growers or Starter");
                setOpenError(true);
                return false;
            }
        }
        if (!values.section || values.section === "CHOOSE_SECTION") {
            setError('Section cannot be empty');
            setOpenError(true);
            return false;
        }
        if (!values.name) {
            setError('User undefined');
            setOpenError(true);
            return false;
        }
        return checkDate(values.date);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const priceAmountRegex = /^([\d]+)$/;
        const bSizeRegex = /^[0-9]+$/.test(state.bag_size);
        const alphaNumRegex = /^([A-Z]|[a-z]| |\/|\(|\)|-|\+|=|[0-9])*$/;
        const arr = Object.entries(state);

        if (!bSizeRegex && state.section.toUpperCase() === 'FEEDS') {
            setError('bag size should be a number');
            setOpenError(true);
            return;
        }

        if(state.paid_by === '' && state.not_paid !== true) {
            setError('paid by should be selected if paid');
            setOpenError(true);
            return;
        }

        if (arr.length < 6) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "item_no" || arr[i][0] === "item_price") {
                if (!priceAmountRegex.test(arr[i][1])) {
                    setError('Object price and amount cannot be negative, zero or not a number');
                    setOpenError(true);
                    return;
                }
            }
            if (arr[i][1] === "" && arr[i][0] === "vendor_name" && state.section === "Feeds") {
                setError('All Inputs should be filled');
                setOpenError(true);
                return;
            }
            if (arr[i][0] === 'extra_data' && !alphaNumRegex.test(arr[i][1])) {
                setError('Extra info should only be letters/numbers or left empty');
                setOpenError(true);
                return;
            }
        }
        let status = true;
        if (state.paid === true && state.paid_by === '') {
            setError('Paid by should not be empty if was paid');
            setOpenError(true);
            return;
        }

        if (state.not_paid === true && state.paid_by !== '') {
            setError('Paid by should be empty if not paid');
            setOpenError(true);
            return;
        }

        values.parent = parentNode;
        if (state.not_paid === true) {
            status = false;
            values.parent = '-1';
        }
        if (status) state.paid_by = `${state.paid_by.toUpperCase()}:${parseInt(state.item_no) * parseInt(state.item_price)},`;
        else state.paid_by = '';

        let values = {
            ...state,
            status,
            name,
        };

        delete values.not_paid;
        delete values.paid;
        delete values.flock;
        if (!values.subgroups) {
            setError('Flock not selected');
            setOpenError(true);
            return;
        }

        if (values.section !== "Feeds") {
            delete values.vendor_name;
            delete values.bag_size;
        } else {
            values.bag_size += 'kg';
        }

        values.section = getSectionAddr(values.section);
        values.item_no = parseInt(values.item_no);
        values.item_price = parseInt(values.item_price);

        let date = new Date(values.date);
        date.setHours(0,0,0,0);
        values.date = date;
        let proceed = parameterChecks(values);
        if (proceed) {
            values.item_name = values.item_name.toUpperCase();
            props.inputExpense(values);
            setOpenError(false);
            setOpen(true);
            const newState = {
                ...state,
                paid_by: '',
                extra_data: ''
            }
            delete state.bag_size;
            delete newState.bag_size;
            delete newState.vendor_name;
            setState(newState);
        } else {
            setState({
                ...state,
                paid_by: ''
            });
            setOpen(false);
        }
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleDate = (date) => {
        setState({
            ...state,
            date: date
        });
    };

    const handleVendor = (e) => {
        setState({
            ...state,
            vendor_name: e
        });
    }

    const handleSelect = (e) => {
        if (e.target) {
            if (e.target?.value === '0') {
                if (e.target.id === 'paid' || e.target.id === 'not_paid') {
                    const paid = document.getElementById('paid').checked;
                    const not_paid = document.getElementById('not_paid').checked;
                    setState({
                        ...state,
                        paid,
                        not_paid
                    });
                } else {
                    setState({
                        ...state,
                        [e.target.id]: e.target.checked
                    });
                }
            } else {
                setState({
                    ...state,
                    [e.target.id]: e.target.value
                });
            }
        } else {
            setState({
                ...state,
                section: e
            });
        }
    }

    useMemo(() => {
        if (/^(([A-Z]|[a-z]){3},)+$/.test(state.item_name) && state.section === 'Pay Purity') {
            setState({
                ...state,
                item_no: (state.item_name.slice(0, -1).split(',').length).toString()
            });
        } else if (state.section === 'Pay Purity') {
            setState({
                ...state,
                item_no: '0'
            });
        }
        // eslint-disable-next-line
    }, [state.item_name]);

    const handlePaidBy = (e) => {
        setState({
            ...state,
            paid_by: e.trim()
        });
    }

    const handleFlock = (e) => {
        if (extraData) {
          const object = extraData[0].subgroups;
          let g = Object.keys(object).find(key => object[key] === e);
          if (e === 'all') {
            const all_groups = ['flock 1', 'flock 2'];
            g = [];
            for (const elem of all_groups) {
                g.push(Object.keys(object).find(key => object[key] === elem));
            }
            g = g.join(';');
          }
          setState({
            ...state,
            subgroups: g,
            flock: e
          });
        }
      }

    const componentDidMount = () => {
        bsCustomFileInput.init()
    }

    useEffect(() => {
        componentDidMount();
    }, []);

    if (redirect) {
        return (
            <Redirect to='/'/>
        )
    }

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">Input Expense</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Input Expense</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Expense</h4>
                        <p className="card-description"> Enter expense </p>
                        <form className="forms-sample">
                            <label htmlFor="date">Date</label>
                            <Form.Group>
                                <DatePicker
                                    selected={state.date}
                                    onChange={handleDate}
                                    className="form-control text-white"
                                    id='date'
                                />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor='flock'>Flock</label>
                                <DropdownButton
                                    alignRight
                                    title={state.flock || 'Choose Flock'}
                                    id='flock'
                                    onSelect={handleFlock}
                                >
                                    {Array(...groups).sort().map(x => {
                                        return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                                    })}
                                </DropdownButton>
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="section">Section</label>
                                <DropdownButton
                                    alignRight
                                    title={state.section}
                                    id="section"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="Feeds">Feeds</Dropdown.Item>
                                    <Dropdown.Item eventKey="Drugs">Drugs</Dropdown.Item>
                                    <Dropdown.Item eventKey="Other Expenses">Other Expenses</Dropdown.Item>
                                    <Dropdown.Divider />
                                    {employeeNames.map(x => {
                                        return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                                    })}
                                </DropdownButton>
                            </Form.Group>
                            {isFeeds &&
                                <Form.Group>
                                    <label htmlFor="vendor_name">Vendor Name</label>
                                    <DropdownButton
                                        alignRight
                                        title={state.vendor_name || 'Choose Feeds vendor'}
                                        id="vendor_name"
                                        onSelect={handleVendor}
                                    >
                                        {feedsVendors.map(x => {
                                            return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                                        })}
                                    </DropdownButton>
                                </Form.Group>
                            }
                            {isFeeds &&
                                <Form.Group>
                                    <label htmlFor="bag_size">Bag size(kg)</label>
                                    <div className="input-group">
                                        <Form.Control type="text"
                                                      onChange={handleSelect}
                                                      className="form-control text-white" value={state.bag_size} id="bag_size" placeholder="Size of bag of feeds in kg" />
                                        <div className="input-group-append">
                                            <span className="input-group-text">kg</span>
                                        </div>
                                    </div>
                                </Form.Group>
                            }
                            <Form.Group>
                                <label htmlFor="item_name">Item Name</label>
                                <Form.Control type="text"
                                              value={state.item_name}
                                              onChange={handleSelect}
                                              className="form-control text-white" id="item_name" placeholder="Name of Item" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="item_no">Number of Objects</label>
                                <Form.Control value={state.item_no} type="text" onChange={handleSelect} className="form-control text-white" id="item_no" placeholder="Number of Objects" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="item_price">Price per Object</label>
                                <Form.Control value={state.item_price} type="text" onChange={handleSelect} className="form-control text-white" id="item_price" placeholder="Price per Object" />
                            </Form.Group>
                            {!state.not_paid && <Form.Group>
                                <label htmlFor='receiver'>Paid by</label>
                                <DropdownButton
                                    alignRight
                                    title={state.paid_by}
                                    id='paid_by'
                                    onSelect={handlePaidBy}
                                >
                                    <Dropdown.Item eventKey="">None</Dropdown.Item>
                                    <Dropdown.Item eventKey="Bank">Bank</Dropdown.Item>
                                    <Dropdown.Divider/>
                                    <Dropdown.Item eventKey="Victor">Victor</Dropdown.Item>
                                    <Dropdown.Item eventKey="Anne">Anne</Dropdown.Item>
                                    <Dropdown.Item eventKey="Jeff">Jeff</Dropdown.Item>
                                    <Dropdown.Item eventKey="Babra">Babra</Dropdown.Item>
                                    <Dropdown.Item eventKey="Purity">Purity</Dropdown.Item>
                                </DropdownButton>
                            </Form.Group>}
                            <Form.Group>
                                <div className='form-check'>
                                    <label htmlFor='1' className='form-check-label'>
                                        <input
                                            type='radio'
                                            onChange={handleSelect}
                                            className='form-check-input'
                                            name='status'
                                            id='paid'
                                            defaultChecked
                                            defaultValue={0}
                                        />
                                        <i className='input-helper' />
                                        Paid
                                    </label>
                                </div>
                                <div className='form-check'>
                                    <label htmlFor='0' className='form-check-label'>
                                        <input
                                            type='radio'
                                            onChange={handleSelect}
                                            className='form-check-input'
                                            name='status'
                                            id='not_paid'
                                            defaultValue={0}
                                        />
                                        <i className='input-helper' />
                                        Not Paid
                                    </label>
                                </div>
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="extra_data">Extra info (optional)</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="extra_data" placeholder="Any extra information" />
                            </Form.Group>
                            <button type="submit" className="btn btn-primary mr-2" onClick={handleSubmit}>Submit</button>
                        </form>
                    </div>
                </div>
            </div>
            <Online>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        Data Submitted
                    </Alert>
                </Snackbar>
            </Online>
            <Offline>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="warning">
                        Data will be submitted automatically when back online
                    </Alert>
                </Snackbar>
            </Offline>
            <Snackbar open={openError} autoHideDuration={3000} onClose={handleClose}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </div>
    )
}

const mapDispatchToProps = (dispatch) => {
    return {
        inputExpense: (buy) => dispatch(inputExpense(buy))
    }
}

const mapStateToProps = function(state) {
    return {
        extraData: state.firestore.ordered.extra_data,
        dash: state.firestore.ordered.dash
    }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
        {
            collection: 'farms',
            doc: '0',
            subcollections: [
                {collection: 'extra_data', doc: 'extra_data'}
            ],
            storeAs: 'extra_data'
        },
        {
            collection: 'farms',
            doc: '0',
            subcollections: [
                {collection: 'dashboard', doc: 'dashboard'}
            ],
            storeAs: 'dash'
        }
    ])
)(InputExpense);
