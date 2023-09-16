import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Online} from "react-detect-offline";
import {compose} from "redux";
import {connect} from "react-redux";
import {firestoreConnect} from "react-redux-firebase";
import {firebase} from "../../services/api/fbConfig";

function saveBlob(blob, fileName) {
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = fileName;
    a.dispatchEvent(new MouseEvent('click'));
}

function DInvoice({ invoices, extraData }) {

    const [open, setOpen] = useState(false);
    const [openM, setOpenM] = useState('Data Submitted');
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [state, setState] = useState({buyers: '', name: '', discount: 0, debtNames: '', purchases: ''});
    const [invoiceNum, setInvoiceNum] = useState(0);
    const [sectionNames, setSectionNames] = useState([]);
    const [buyer_names, setBuyerNames] = useState([]);
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        if (extraData) {
            setSectionNames(extraData[0].main_buyers || []);
            setBuyerNames(extraData[0].buyer_names || []);
        }
    }, [extraData]);

    useEffect(() => {
        if (invoices) {
            setInvoiceNum(invoices[0]?.num);
        }
    }, [invoices]);

    const handleClick = (e) => {
        e.preventDefault();
        setIsClicked(true);
        const debtName = /^(([A-Z]|[a-z]| )+,)*$/;

        if (state.name === '') {
            setError("invoice should be addressed to someone");
            setOpen(false);
            setOpenError(true);
            setIsClicked(false);
            return 0;
        }

        if (!/^[0-9]+$/.test(state.discount)) {
            setError("discount applied should be a number");
            setOpen(false);
            setOpenError(true);
            setIsClicked(false);
            return 0;
        }
        if (!debtName.test(state.debtNames)) {
            setError("debt names format should be [name,name,] or empty");
            setOpen(false);
            setOpenError(true);
            setIsClicked(false);
            return 0;
        }
        if (!debtName.test(state.buyers)) {
            setError("buyer names format should be [name,name,] or empty");
            setOpen(false);
            setOpenError(true);
            setIsClicked(false);
            return 0;
        }

        const buyers = state.buyers !== '' ? state.buyers.slice(0, -1).split(',') : [];
        const otherBuyers = sectionNames.map(x => x.toUpperCase());
        const validNames = buyer_names.map(x => x.toUpperCase());

        for (const x of buyers) {
            if (!validNames.includes(x.toUpperCase()) && !otherBuyers.includes(x.toUpperCase())) {
                setError("invalid buyer name provided");
                setOpen(false);
                setOpenError(true);
                setIsClicked(false);
                return 0;
            }
        }
        let cleanName = state.name;
        cleanName = cleanName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        cleanName = cleanName.replace(/ +/, '');

        if (!invoices) {
            setError("you might be offline, go back online to proceed");
            setOpen(false);
            setOpenError(true);
            setIsClicked(false);
            return 0;
        }

        setOpenError(false);
        setOpenM("Generating invoice, please wait...");
        setOpen(true);

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({
            buyers: buyers.toString(),
            cleanName: cleanName,
            discount: state.discount.toString(),
            purchases: state.purchases.slice(0, -1)
        });
        console.log(raw);

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch("https://us-central1-poultry101-f1fa0.cloudfunctions.net/genInvoice", requestOptions)
            .then(response => response.text())
            .then(result => {
                console.log(result);
                //Create a reference with an initial file path and name
                const storage = firebase.storage();
                const storageRef = storage.ref('invoices/');
                storageRef.child(`${invoiceNum}_${cleanName}_invoice.pdf`).getDownloadURL()
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
                        setError("invoice generation failed");
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
                                <Form.Control value={state.name} type="text" onChange={handleSelect} className="form-control text-white" id="name" placeholder="recipient name" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="buyers">Buyer Name(s) to include</label>
                                <p className="text-primary">Valid names: {sectionNames.join(', ')+', '+buyer_names.join(', ')}</p>
                                <Form.Control value={state.buyers} type="text" onChange={handleSelect} className="form-control text-white" id="buyers" placeholder="buyer names (comma separated)" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="buyers">Discount amount in KES(Optional)</label>
                                <Form.Control value={state.discount} type="text" onChange={handleSelect} className="form-control text-white" id="discount" placeholder="discount applied" />
                            </Form.Group>
                            <a href={__dirname+'InputSell.js'} download onClick={handleClick} className={`btn btn-primary mr-2 ${isClicked ? 'disabled' : ''}`}>Generate</a>
                        </form>
                    </div>
                </div>
            </div>
            <Online>
                <Snackbar open={open} autoHideDuration={10000} onClose={handleClose}>
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

const mapStateToProps = function(state) {
    return {
        invoices: state.firestore.ordered.invoices,
        extraData: state.firestore.ordered.extra_data
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'invoices', doc: 'count'},
        {collection: 'extra_data', doc: 'extra_data'}
    ])
)(DInvoice);
