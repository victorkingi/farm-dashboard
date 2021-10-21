import React, {useEffect, useState} from 'react';
import {Form} from 'react-bootstrap';
import {connect} from 'react-redux';
import {inputTray} from '../../services/actions/eggsAction';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import "react-datepicker/dist/react-datepicker.css";
import {Offline, Online} from "react-detect-offline";

function safeTrayEggConvert(data, inverse, reduce, amount) {
    //returns a string 0,0 given egg number if inverse false
    //else returns egg number given str
    if (inverse) {
        if (reduce || amount) throw new Error("reduce and amount should be undefined");
        data = data.split(',');
        if (data.length !== 2) throw new Error("Length not 2");
        if (!data[0] || !data[1]) throw new Error("Data is undefined");
        else if (typeof data[0] !== 'string' || typeof data[1] !== 'string') throw new Error("Type error producing eggs");
        return (parseInt(data[0]) * 30) + parseInt(data[1]);
    } else {
        if (typeof data !== 'number') throw new Error("Data wasn't a number");
        if (typeof amount !== 'number' && reduce) throw new Error("trays to remove were not specified");
        else if (data < 0) throw new Error("Invalid negative number");
        const trays = Math.floor(data / 30);
        const eggs = data % 30;
        const correctConvert = ((trays * 30) + eggs) === data;
        console.log("Eggs", data, "trays:", trays, "eggs", eggs);
        if (!correctConvert) throw new Error("Conversion failed, expected: "+data+" but got: "+(trays * 30) + eggs);
        console.log("Before trays:", trays);
        return `${reduce ? (trays - amount) : trays},${eggs}`;
    }
}

export function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export function getLevelArray(obj) {
    return Object.entries(obj);
}

function getFinalLevelArray(state) {
    const arr = getLevelArray(state);
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        if (!(arr[i][0] === "eggs" || arr[i][0] === "date_"
            || arr[i][0] === "trays_store" || arr[i][0] === "category")) {
            newArr.push(arr[i][1]);
        }
    }
    return newArr;
}

//
function InputEggs(props) {
    const [state, setState] = useState({
        date_: new Date(),
        category: 'eggs'
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const checkEggNumber = (eggs, date) => {
        let expected = localStorage.getItem('expected');
        if (expected !== null) {
            expected = JSON.parse(expected);
            let found = false;
            let isFalse = false;
            for (let i = 0; i < expected.length; i++) {
                let eDate = new Date(expected[i].date);
                let amount = expected[i].eggs;
                let acceptedDiff = 100;
                const cleanedDate  = new Date(date);
                cleanedDate.setHours(0, 0, 0, 0);
                if (eDate.getTime() === cleanedDate.getTime()) {
                    found = true;
                    if (eggs > acceptedDiff+amount || eggs < amount - acceptedDiff) {
                        isFalse = true;
                    }
                }
            }
            if (!found) {
                setError('No match found');
                setOpenError(true);
                return false;
            } else {
                if (isFalse) {
                    setError('Trays entered don\'t seem correct');
                    setOpenError(true);
                    return false;
                }
            }
        }
        return true;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const levelRegex = /^([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-5])$/;
        const trayStoreRegex = /^[\d]+,([0-9]|1[0-9]|2[0-9])$/;
        const bagsRegex = /^[\d]+$/.test(state.bags_store);
        const arr = Object.entries(state);

        if (arr.length < 11) {
            setError('All Inputs should be filled');
            setOpenError(true);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][1] === "" || !arr[i][1]) {
                setError('All Inputs should be filled');
                setOpenError(true);
                return;
            }
            if (arr[i][0] === "trays_store") {
                if (!trayStoreRegex.test(arr[i][1])) {
                    setError('Trays in store should be of this format [Trays,eggs] & eggs are always less than 29');
                    setOpenError(true);
                    return;
                }
                break;
            }
        }



        const newArr = getFinalLevelArray(state);

        for (let i = 0; i < newArr.length; i++) {
            if (!levelRegex.test(newArr[i])) {
                setError('All level inputs should range from 0-75');
                setOpenError(true);
                return;
            }
        }
        if (!bagsRegex) {
            setError('Bags entered should only be a number');
            setOpenError(true);
            return;
        }
        const eggs = safeTrayEggConvert(state.trays_store, true);
        if (new Date().getTimezoneOffset() !== -180) {
            setError('Different Timezone detected. Cannot handle input');
            setOpenError(true);
            return;
        }
        const eggsOk = checkEggNumber(eggs, state.date_);
        if (eggsOk) {
            props.inputTray(state);
            setOpenError(false);
            setOpen(true);
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
            date_: date
        });
    }

    const handleSelect = (e) => {
        e.preventDefault();
        if (e.target) {
            setState({
                ...state,
                [e.target.id]: e.target.value
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
                <h3 className="page-title">Input Eggs Collected</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Input Eggs</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Eggs</h4>
                        <p className="card-description"> Enter eggs collected </p>
                        <form className="forms-sample">
                            <label htmlFor="date_">Date</label>
                            <Form.Group>
                                <DatePicker
                                    selected={state.date_}
                                    onChange={handleDate}
                                    className='form-control'
                                    id='date_'
                                />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="a1">A1</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="a1" placeholder="A1 Eggs" required />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="b1">B1</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="b1" placeholder="B1 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="c1">C1</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="c1" placeholder="C1 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="a2">A2</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="a2" placeholder="A2 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="b2">B2</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="b2" placeholder="B2 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="c2">C2</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="c2" placeholder="C2 Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="house">House</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="house" placeholder="House Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="broken">Broken</label>
                                <Form.Control type="number" onChange={handleSelect} className="form-control" id="broken" placeholder="Broken Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="trays_store">Total Trays</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="trays_store" placeholder="Total Trays And Extra Eggs Collected" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="bags_store">Bags in Store</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="bags_store" placeholder="Current bags of feeds in store" />
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
            <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                <Alert severity="error">{error}!</Alert>
            </Snackbar>
        </div>
    )
}

const mapDispatchToProps = (dispatch) => {
    return {
        inputTray: (egg) => dispatch(inputTray(egg))
    }
}

export default connect(null, mapDispatchToProps)(InputEggs);
