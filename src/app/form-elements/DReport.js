import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Online} from "react-detect-offline";
import {firebase} from "../../services/api/fbConfig";
import uniqid from 'uniqid';

export function saveBlob(blob, fileName) {
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = fileName;
    a.onload = () => {
        window.URL.revokeObjectURL(a.href);
    };
    a.dispatchEvent(new MouseEvent('click'));
}

const cur_year = new Date().getFullYear();
const cur_month = new Date().toLocaleString('en-US', { month: 'short' });

function DInvoice() {

    const [open, setOpen] = useState(false);
    const [openM, setOpenM] = useState('');
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [state, setState] = useState({year: cur_year, month: cur_month});
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = (e) => {
        e.preventDefault();
        setIsClicked(true);

        setOpenError(false);
        setOpenM("Generating Report, please wait...");
        setOpen(true);

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        state.month = state.month.trim().toLowerCase();
        const fname = uniqid(`${state.year}_${state.month}_report_`, `.pdf`);
        const raw = JSON.stringify({
            year: parseInt(state.year),
            month: state.month,
            fname
        });
        console.log(raw);

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://us-central1-poultry101-f1fa0.cloudfunctions.net/gen-report", requestOptions)
            .then(response => response.text())
            .then(result => {
                console.log(result);
                //Create a reference with an initial file path and name
                const storage = firebase.storage();
                const storageRef = storage.ref('reports/');
                storageRef.child(fname).getDownloadURL()
                    .then((url) => {
                        // `url` is the download URL for 'images/stars.jpg'
                        // This can be downloaded directly:
                        const xhr = new XMLHttpRequest();
                        xhr.responseType = 'blob';
                        xhr.onload = () => {
                            const blob = xhr.response;
                            let file_name = xhr.responseURL.split('/')[7];
                            file_name = file_name.split('?')[0];
                            file_name = file_name.split('%2F')[1];
                            saveBlob(blob, file_name);
                            setIsClicked(false);
                        };
                        xhr.open('GET', url);
                        xhr.send();
                    })
                    .catch(() => {
                        setError("report creation failed");
                        setOpen(false);
                        setOpenError(true);
                        setIsClicked(false);
                        return 0;
                    });
            })
            .catch(error => {
                console.log('error', error)
                setError("Error occurred");
                setOpen(false);
                setOpenError(true);
                setIsClicked(false);
            });
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
            [e.target.id]: e.target.value
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
                <h3 className="page-title">Download Monthly Report</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Report</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Details</h4>
                        <form className="forms-sample">
                            <Form.Group>
                                <label htmlFor="year">Year</label>
                                <Form.Control value={state.year} defaultValue={cur_year} type="text" onChange={handleSelect} className="form-control text-white" id="year" placeholder="year" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="month">Month</label>
                                <Form.Control value={state.month} defaultValue={cur_month} type="text" onChange={handleSelect} className="form-control text-white" id="month" placeholder="month" />
                            </Form.Group>
                            <a href={__dirname+'InputSell.js'} download onClick={handleClick} className={`btn btn-primary mr-2 ${isClicked ? 'disabled' : ''}`}>Generate</a>
                        </form>
                    </div>
                </div>
            </div>
            <Online>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="success">
                        {openM}
                    </Alert>
                </Snackbar>
            </Online>
            <Snackbar open={openError} autoHideDuration={4000} onClose={handleClose}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </div>
    )
}

export default DInvoice;
