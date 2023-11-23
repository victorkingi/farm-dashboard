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
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import {compose} from "redux";
import {firestoreConnect} from "react-redux-firebase";


export function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const getEggsDiff = (temp) => {
    let total = temp.eggs.slice(0, -1).split(',');
    total = total.reduce((prev, cur) => parseInt(prev) + parseInt(cur));
    let expectedTotal = temp.trays_store.split(',');
    expectedTotal = (parseInt(expectedTotal[0])*30)+parseInt(expectedTotal[1]);
    return total-expectedTotal;
}

//
function InputEggs(props) {
    const { extraData } = props;

    const [state, setState] = useState({
        date_: new Date(),
        category: 'eggs_collected',
        extra_data: ''
    });
    const [open, setOpen] = useState(false);
    const [openM, setOpenM] = useState('Data Submitted');
    const [offlineM, setOfflineM] = useState('Data will be submitted automatically when back online');
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (extraData) {
            let groups = extraData[0].subgroups || {};
            groups = Object.keys(groups).filter(
                key => key.split('::')[1] === '0').reduce(
                    (cur, key) => { return Object.assign(cur, { [key]: groups[key] })}, {});

            setGroups(Object.values(groups) || []);
        }
      }, [extraData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trayStoreRegex = /^[0-9]+,([0-9]|1[0-9]|2[0-9])$/;
        let eggsRegex = /^([0-9]+,){11}[0-9]+$/;

        if (state.flock === 'flock 2') 
            eggsRegex = /^([0-9]+,){5}[0-9]+$/;

        const bagsRegex = /^[0-9]+$/.test(state.bags_store);
        const brokenRegex = /^[0-9]+$/.test(state.broken);
        const alphaNumRegex = /^([A-Z]|[a-z]| |\/|\(|\)|-|\+|=|[0-9])*$/;
        const temp = {
            ...state
        };

        if (state.eggs1 && state.eggs2 && state.eggs3 && state.eggs4) {
            temp.eggs = state.eggs1 + ',' + state.eggs2
                + ',' + state.eggs3 + ',' + state.eggs4;
            delete temp.eggs1;
            delete temp.eggs2;
            delete temp.eggs3;
            delete temp.eggs4;
        } else if (state.eggs1 && state.eggs2) {
            temp.eggs = state.eggs1 + ',' + state.eggs2;
            console.log("change", temp.eggs);
            delete temp.eggs1;
            delete temp.eggs2;
            delete temp.eggs3;
            delete temp.eggs4;
        }
        const arr = Object.entries(temp);

        if (!eggsRegex.test(temp.eggs)) {
            setError('eggs collected should be in this format [a,b,c]');
            setOpenError(true);
            console.log("egg format wrong");
            return;
        }
        temp.eggs += ',';

        for (let i = 0; i < arr.length; i++) {
            if ((arr[i][1] === "" || !arr[i][1]) && (arr[i][0] !== "extra_data" && arr[i][0] !== "bags_store")) {
                setError('All Inputs should be filled');
                setOpenError(true);
                console.log("some inputs empty");
                return;
            }
            if (arr[i][0] === "trays_store") {
                if (!trayStoreRegex.test(arr[i][1])) {
                    setError('Trays in store should be of this format [Trays,eggs] & eggs are always less than 29');
                    setOpenError(true);
                    console.log("tray format wrong");
                    return;
                }
                break;
            }
            if (arr[i][0] === 'extra_data' && !alphaNumRegex.test(arr[i][1])) {
                setError('Extra info should only be letters/numbers or left empty');
                setOpenError(true);
                console.log("extra info wrong");
                return;
            }
        }

        if (!bagsRegex) {
            setError('Bags in store should be a number');
            setOpenError(true);
            return;
        }

        if (!brokenRegex) {
            setError('Broken eggs entered should only be a number');
            setOpenError(true);
            return;
        }

        temp.extra_data = temp.extra_data + ';;' + temp.bags_store;
        delete temp.bags_store;
        delete temp.flock;
        temp.broken = parseInt(temp.broken);

        if (!temp.subgroups) {
            setError('Flock not selected');
            setOpenError(true);
            return;
        }
        const offBy = getEggsDiff(temp);
        
        props.inputTray(temp);

        if (offBy !== 0) {
            if (offBy > 0) {
                setOpenM(`Got ${offBy} less eggs than expected. Data Submitted`);
                setOfflineM(`Got ${offBy} less eggs than expected. Data will be submitted automatically when back online`);
            } else {
                setOpenM(`Got ${Math.abs(offBy)} more eggs than expected. Data Submitted`);
                setOfflineM(`Got ${Math.abs(offBy)} more eggs than expected. Data will be submitted automatically when back online`);
            }
        } else {
            setOfflineM("Data will be submitted automatically when back online");
            setOpenM("Data Submitted");
        }

        setOpenError(false);
        setOpen(true);
        setState({
            ...state,
            extra_data: ''
        });
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
                [e.target.id]: e.target.value.trim()
            });
        }
    }

    const handleFlock = (e) => {
        if (extraData) {
          const object = extraData[0].subgroups;
          let g = Object.keys(object).find(key => object[key] === e);
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
                                    className="form-control text-white"
                                    id='date_'
                                />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="level">Level ordering</label>
                                <Form.Control disabled type="text" className="form-control text-white" id="level" placeholder="A,B,C" />
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
                                <label htmlFor="eggs">Eggs column 1</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="eggs1" placeholder="Eggs in column 1 (comma separated)" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="eggs">Eggs column 2</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="eggs2" placeholder="Eggs in column 2 (comma separated)" />
                            </Form.Group>
                            {(state.flock === 'flock 1' || !state.flock)  && 
                            <Form.Group>
                                <label htmlFor="eggs">Eggs column 3</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="eggs3" placeholder="Eggs in column 3 (comma separated)" />
                            </Form.Group>}
                            {(state.flock === 'flock 1' || !state.flock) &&
                            <Form.Group>
                                <label htmlFor="eggs">Eggs column 4</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="eggs4" placeholder="Eggs in column 4 (comma separated)" />
                            </Form.Group>}
                            <Form.Group>
                                <label htmlFor="broken">Broken</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="broken" placeholder="Broken Eggs" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="trays_store">Total Trays</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="trays_store" placeholder="Total Trays And Extra Eggs Collected" />
                            </Form.Group>
                            <Form.Group>
                                <label htmlFor="bags_store">Bags in Store</label>
                                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="bags_store" placeholder="Unopened bags of feeds in store" />
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
                        {openM}
                    </Alert>
                </Snackbar>
            </Online>
            <Offline>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="warning">
                        {offlineM}
                    </Alert>
                </Snackbar>
            </Offline>
            <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </div>
    )
}

const mapDispatchToProps = (dispatch) => {
    return {
        inputTray: (egg) => dispatch(inputTray(egg))
    }
}

const mapStateToProps = function(state) {
    return {
      extraData: state.firestore.ordered.extra_data
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
    ])
)(InputEggs);
