import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import {connect} from 'react-redux';
import {inputDeadSick} from "../../services/actions/DeadSickAction";
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import {Redirect} from "react-router-dom";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "./InputEggs";
import {Offline, Online} from "react-detect-offline";
import {compose} from "redux";
import {firestoreConnect} from "react-redux-firebase";


function InputDeadSick(props) {
    const { extraData } = props;

    const [state, setState] = useState({
        date: new Date(),
        category: 'dead_sick',
        extra_data: ''
    });
    const [open, setOpen] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (extraData) {
          setGroups(Object.values(extraData[0].groups || {}) || []);
        }
      }, [extraData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numberRegex = /^([1-9][0-9]*)$/;
        const alphaNumRegex = /^([A-Z]|[a-z]| |\/|\(|\)|-|\+|=|[0-9])*$/;
        const levelRegex = /^[a-z]([0-9])+$/;

        const arr = Object.entries(state);

        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === "num") {
                if (!numberRegex.test(arr[i][1])) {
                    setError('Chicken number cannot be negative or not a number');
                    setOpenError(true);
                    return;
                }
                break;
            }

            if (arr[i][0] === 'extra_data' && !alphaNumRegex.test(arr[i][1])) {
                setError('Extra info should only be letters/numbers or left empty');
                setOpenError(true);
                return;
            }
        }
        if (!image) {
            setError('An image should be provided');
            setOpenError(true);
            return;
        }
        if (!image.type.startsWith('image')) {
            setError(`Only images are accepted, found ${image.type}`);
            setOpenError(true);
            return;
        }
        if (!state.section) {
            setError(`Section should be provided. Was it dead or sick?`);
            setOpenError(true);
            return;
        }
        if (!levelRegex.test(state.level)) {
            setError('Row name should be like this "a1"');
            setOpenError(true);
            return;
        }
        if (!numberRegex.test(state.num)) {
            setError('Chicken number cannot be negative, 0 or not a number');
            setOpenError(true);
            return;
        }
        if (!state.reason || state.reason === '') {
            setError('reason cannot be empty');
            setOpenError(true);
            return;
        }
        if (!state.flock) state.group = "0::0";
        delete state.flock;
        props.inputDeadSick(state, image);
       
        setOpenError(false);
        setOpen(true);
        setState({
            ...state,
            extra_data: ''
        });
    };

    const handleDate = (date) => {
        setState({
            ...state,
            date: date
        });
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        setOpenError(false);
    };

    const handleFlock = (e) => {
        if (extraData) {
          const object = extraData[0].groups;
          let g = Object.keys(object).find(key => object[key] === e);
          setState({
            ...state,
            group: g,
            flock: e
          });
        }
      }

    const handleSelect = (e) => {
        if (e.target) {
            if (e.target.files) {
                if (e.target.files[0]) {
                    setImage(e.target.files[0]);
                }
            }
            if (e.target?.value !== '0') {
                setState({
                    ...state,
                    [e.target.id]: e.target.value
                });
            }
        } else {
            if (e.trim() === "Dead" || e.trim() === "Sick") {
                setState({
                    ...state,
                    section: e
                });
            } else {
                setState({
                    ...state,
                    place: e.trim()
                });
            }
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
                    <h3 className="page-title">Input Dead/Sick</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => {
                                event.preventDefault();
                                setRedirect(true);
                            }}>Home</a></li>
                            <li className="breadcrumb-item active" aria-current="page">Input Dead/Sick</li>
                        </ol>
                    </nav>
                </div>
                <div className="col-xl grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Input Dead/Sick</h4>
                            <p className="card-description"> Enter dead/sick chickens </p>
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
                                <label htmlFor="section">Section</label>
                                <DropdownButton
                                    alignRight
                                    title={state.section || ''}
                                    id="location"
                                    onSelect={handleSelect}
                                >
                                    <Dropdown.Item eventKey="Dead">Dead</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="Sick">Sick</Dropdown.Item>
                                </DropdownButton>
                                <br />
                                <Form.Group>
                                    <label htmlFor="level">Location</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="level" placeholder="row name" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="num">Number of Chickens</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="num" placeholder="Number of Chickens" />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="reason">Reason (and Treatment Given)</label>
                                    <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="reason" placeholder="Reason and Treatment If Applicable" />
                                </Form.Group>
                                <Form.Group>
                                    <label>File upload</label>
                                    <div className="custom-file">
                                        <Form.Control type="file" className="form-control visibility-hidden" id="photo" lang="es" onChange={handleSelect} />
                                        <label className="custom-file-label" htmlFor="photo">Upload image</label>
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
                            Data Submitted, check upload progress at bell icon
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
                    <Alert severity="error">{error}</Alert>
                </Snackbar>
            </div>
        )
}

const mapDispatchToProps = (dispatch) => {
    return {
        inputDeadSick: (deadSick, image) => dispatch(inputDeadSick(deadSick, image))
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
      {collection: 'extra_data', doc: 'extra_data'}
    ])
)(InputDeadSick);
