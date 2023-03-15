import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Offline, Online} from "react-detect-offline";
import {firestore} from '../../services/api/fbConfig';
import Localbase from "localbase";


let today = new Date();
today.setHours(0, 0, 0, 0);
today = Math.floor(today.getTime() / 1000);
const name = localStorage.getItem('name') || '';
const db = new Localbase('ver_data');

function InputChknNo() {
    const [open, setOpen] = useState(false);
    const [openM, setOpenM] = useState('Data Submitted');
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');

    const [state, setState] = useState({});
    const [rewind, setRewind] = useState(false);

    useEffect(() => {
        if (rewind) {
            if (new Date().getTimezoneOffset() !== -180  && localStorage.getItem('name') !== 'Victor') {
                setOpen(false);
                setError("Different Timezone detected. Cannot handle input");
                setOpenError(true);
                return -1;
            }
            firestore.doc(`chicken_no/exact`)
                .update({
                    [today]: -1
                });
            firestore.doc(`chicken_no/by`)
                .update({
                    [today]: name
                });
            setOpenError(false);
            setOpenM('Value deleted');
            setOpen(true);
            setRewind(false);
        }
    }, [rewind]);

    const handleClick = (e) => {
        e.preventDefault();

        const temp = {
            ...state
        };

        if (state.chick1 && state.chick2 && state.chick3 && state.chick4) {
            temp.chicks = state.chick1
                + ',' + state.chick2
                + ',' + state.chick3
                + ',' + state.chick4;
            delete temp.chick1;
            delete temp.chick2;
            delete temp.chick3;
            delete temp.chick4;
        }
        const levelOk = /^([0-9]+,){11}[0-9]+$/.test(temp.chicks);
        if (levelOk) {
            temp.chicks += ',';

            const verifyAndPush = async () => {
                const document = await db.collection('hashes').doc('ver').get();

                if (document.birdsNo) {
                    let chicks = document.birdsNo;
                    let chicken_no = temp.chicks.split(',');
                    chicken_no.pop();
                    chicken_no = chicken_no.map(item => parseInt(item));
                    const total = chicken_no.reduce((res, item) => res + item, 0);
                    if (total !== chicks.total) {
                        setOpen(false);
                        setError(`Expected ${chicks.total} birds but got ${total}. Some dead birds were not entered`);
                        setOpenError(true);
                        return -1;
                    }
                    const levelOrder = ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3', 'a4', 'b4', 'c4'];
                    let idx = 0;
                    let allSame = true;
                    for (const x of chicken_no) {
                        if (x !== chicks[levelOrder[idx]]) allSame = false;
                        idx++;
                    }
                    if (allSame) {
                        setOpen(false);
                        setError(`Number of birds is the same`);
                        setOpenError(true);
                        return -1;
                    }
                } else {
                    setOpen(false);
                    setError("internal required data missing");
                    setOpenError(true);
                    return -1;
                }

                if (new Date().getTimezoneOffset() !== -180 && localStorage.getItem('name') !== 'Victor') {
                    setOpen(false);
                    setError("Different Timezone detected. Cannot handle input");
                    setOpenError(true);
                    return -1;
                }
                firestore.doc(`chicken_no/exact`)
                    .update({
                        [today]: temp.chicks
                    });
                firestore.doc(`chicken_no/by`)
                    .update({
                        [today]: name
                    });
                setOpenError(false);
                setOpenM('Data Submitted');
                setOpen(true);
            }
            verifyAndPush();
        } else {
            setOpen(false);
            setError("Values not correct, retry with this format. [a,b,c]");
            setOpenError(true);
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleSelect = (e) => {
        e.preventDefault();
        setState({
            ...state,
            [e.target.id]: e.target.value.trim()
        });
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
                <h3 className="page-title">Input Chicken Number</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Input Chicken Number</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Number of Chickens</h4>
                        <p className="card-description"> Enter number of chickens in each level</p>
                        <form className="forms-sample">
                            <Form.Group>
                                <label htmlFor="level">Level ordering</label>
                                <Form.Control disabled type="text" className="form-control text-white" id="level" placeholder="A,B,C" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="chick1">Column 1</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="chick1" placeholder="Chicken number in column 1" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="chick2">Column 2</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="chick2" placeholder="Chicken number in column 2" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="chick3">Column 3</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="chick3" placeholder="Chicken number in column 3" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="chick4">Column 4</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="chick4" placeholder="Chicken number in column 4" />
                            </Form.Group>
                            <button type="submit" className="btn btn-primary mr-2" onClick={handleClick}>Submit</button>
                            <button type="button" className="btn btn-dark" onClick={() => setRewind(true)}>Undo</button>
                        </form>
                    </div>
                </div>
            </div>
            <Online>
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        {openM}
                    </Alert>
                </Snackbar>
            </Online>
            <Offline>
                <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="warning">
                        {openM === 'Data Submitted' ? 'Data will be updated once back online' : 'Data will be deleted once back online'}
                    </Alert>
                </Snackbar>
            </Offline>
            <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </div>
    )
}

export default InputChknNo;
