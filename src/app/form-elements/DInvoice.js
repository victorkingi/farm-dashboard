import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Offline, Online} from "react-detect-offline";
import {compose} from "redux";
import {connect} from "react-redux";
import {firestoreConnect} from "react-redux-firebase";
import {validNames} from "./InputSell";
import {firebase} from "../../services/api/fbConfig";

let today = new Date();
today.setHours(0, 0, 0, 0);
today = Math.floor(today.getTime() / 1000);
const name = localStorage.getItem('name') || '';

function saveBlob(blob, fileName) {
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = fileName;
    a.dispatchEvent(new MouseEvent('click'));
}

function DInvoice({ invoices }) {

    const [open, setOpen] = useState(false);
    const [openM, setOpenM] = useState('Data Submitted');
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [state, setState] = useState({name: ''});
    const [invoiceNum, setInvoiceNum] = useState(0);

    useEffect(() => {
        if (invoices) {
            setInvoiceNum(invoices[0].num);
        }
    }, [invoices]);

    const handleClick = (e) => {
        e.preventDefault();
        const buyerRegex = /^(([A-Z]|[a-z])+,)+$/;
        if (!buyerRegex.test(state.buyers)) {
            setError("buyer names format should be [name,name,]");
            setOpen(false);
            setOpenError(true);
            return 0;
        }
        const buyers = state.buyers.slice(0, -1).split(',');
        const otherBuyers = ['DUKA', 'THIKAFARMERS', 'CAKES'];
        for (const x of buyers) {
            if (!validNames.includes(x.toUpperCase()) && !otherBuyers.includes(x.toUpperCase())) {
                setError("invalid buyer name provided");
                setOpen(false);
                setOpenError(true);
                return 0;
            }
        }
        let cleanName = state.name;
        cleanName = cleanName.replace(/[^a-zA-Z ]/g, "").trim();

        if (!invoices) {
            setError("you might be offline, go back online to proceed");
            setOpen(false);
            setOpenError(true);
            return 0;
        }

        setOpenError(false);
        setOpenM("Generating invoice, please wait...");
        setOpen(true);

        const genInvoice = firebase.functions().httpsCallable('genInvoice');
        genInvoice({ genData: {to: cleanName, buyers } })
            .then((result) => {
                // Read result of the Cloud Function.
                const isSuccess = result.data.genData;
                console.log("gen success", isSuccess);
            }).catch((error) => {
            // Getting the Error details.
            const code = error.code;
            const message = error.message;
            const details = error.details;
            console.log(code, message, details);
        });

        // Create a reference with an initial file path and name
        const storage = firebase.storage();
        const storageRef = storage.ref('invoices/');
        storageRef.child(`${invoiceNum}_${cleanName}_invoice.pdf`).getDownloadURL()
            .then((url) => {
                // `url` is the download URL for 'images/stars.jpg'
                // This can be downloaded directly:
                const xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                xhr.onload = (event) => {
                    const blob = xhr.response;
                    let file_name = xhr.responseURL.split('/')[7];
                    file_name = file_name.split('?')[0];

                    saveBlob(blob, file_name);
                };
                xhr.open('GET', url);
                xhr.send();
            })
            .catch((error) => {
                setError("invoice generation failed");
                setOpen(false);
                setOpenError(true);
                return 0;
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
                <h3 className="page-title">Download Invoice</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                            event.preventDefault();
                            setRedirect(true);
                        }}>Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Invoice</li>
                    </ol>
                </nav>
            </div>
            <div className="col-xl grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Input Details</h4>
                        <form className="forms-sample">
                            <Form.Group>
                                <label htmlFor="name">Invoice addressed to?</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="name" placeholder="recipient name" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="buyers">Buyer Name(s) to include</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control" id="buyers" placeholder="buyer names (comma separated)" />
                            </Form.Group>
                            <a href={__dirname+'InputSell.js'} download onClick={handleClick} className="btn btn-primary mr-2">Generate</a>
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

const mapStateToProps = function(state) {
    return {
        invoices: state.firestore.ordered.invoices
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'invoices'}
    ])
)(DInvoice);
