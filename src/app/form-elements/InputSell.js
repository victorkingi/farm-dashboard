import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Redirect } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Snackbar from '@material-ui/core/Snackbar';
import { Alert } from './InputEggs';
import { getSectionAddr, inputSell } from '../../services/actions/salesAction';
import { Offline, Online } from 'react-detect-offline';
import { firebase } from '../../services/api/fbConfig';
import  SHA256 from 'crypto-js/sha256';
import MerkleTree from 'merkletreejs';
import Localbase from "localbase";
import {compose} from "redux";
import {firestoreConnect} from "react-redux-firebase";

const db = new Localbase('ver_data');

function InputSell(props) {
  const { extraData, trayCheck } = props;

  const [state, setState] = useState({
    category: 'sales',
    date: new Date(),
    section: 'Choose Section',
    buyerName: '',
    trayPrice: '350',
    trayNo: '1',
    receiver: localStorage.getItem('name'),
    extra_data: ''
  });
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');
  const [sectionNames, setSectionNames] = useState([]);
  const [buyerNames, setBuyerNames] = useState([]);

  let name = firebase.auth().currentUser?.displayName;
  name = name ? name.substring(0, name.lastIndexOf(' '))
      .toUpperCase() : '';

  useEffect(() => {
    if (extraData) {
      setSectionNames(extraData[0].main_buyers || []);
      setBuyerNames(extraData[0].buyer_names || []);
    }
  }, [extraData]);


  useEffect(() => {
    db.collection('hashes').doc({ id: 1 }).get().then(document => {
      let amount = parseInt(document.loss.amount);
      if (amount !== 0) {
        if (amount < 0) amount *= -1;
        const price = Math.round(amount/parseInt(state.trayNo));
        if (price > 300 || isNaN(price)) setState({...state, trayPrice: `${isNaN(price) ? '350' : price > 1000 ? '350' : price}`})
        else setState({...state, trayPrice: '350'})
      }
    });
          // eslint-disable-next-line
  }, [state.trayNo]);

  const checkDate = (date) => {
    if (date.getTime() > new Date().getTime()) {
      setError('Invalid date');
      setOpenError(true);
      return false;
    } else {
      return true;
    }
  };

  const parameterChecks = (values) => {
    if (!values.section) {
      setError('Section is empty!');
      setOpenError(true);
      return false;
    }
    if (!values.name) {
      setError('User undefined');
      setOpenError(true);
      return false;
    }
    const stripBuyer = values.buyerName.trim().toUpperCase();
    const fixedSections = sectionNames.map(x => x.toUpperCase());
    const validNames = buyerNames.map(x => x.toUpperCase());

    if (!validNames.includes(stripBuyer) && !fixedSections.includes(values.section)) {
      setError('Buyer name does not exist');
      setOpenError(true);
      return false;
    }
    values.buyerName = stripBuyer;

    let proceed = checkDate(values.date);
    if (proceed) {
      const epoch = values.date.getTime()/1000;
      if (trayCheck) {
        const allKeys = Object.keys(trayCheck[0]).filter(val => val !== 'id');
        const trayInvalid = allKeys.includes(epoch.toString());
        return !trayInvalid && !!values.buyerName;
      }
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date().getTimezoneOffset() !== -180 && localStorage.getItem('name') !== 'Victor') {
      setError('Different Timezone detected. Cannot handle input');
      setOpenError(true);
      return;
    }

    const arr = Object.entries(state);
    const trayRegex = /^([0-9]+)$/;
    const noZeroRegex = /^(0*)$/;
    const alphaNumRegex = /^([A-Z]|[a-z]| |\/|\(|\)|-|\+|=|[0-9])*$/;

    if (arr.length < 5) {
      setError('All Inputs should be filled');
      setOpenError(true);
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][1] === '' && arr[i][0] !== 'extra_data') {
        setError('All Inputs should be filled');
        setOpenError(true);
        return;
      }
      if (arr[i][0] === 'section') {
        if (arr[i][1] === 'Choose Section') {
          setError('Section should be selected');
          setOpenError(true);
          return;
        }
        if (arr[i][1] !== 'Other Buyer') {
          if (state.section !== state.buyerName) {
            setError('Section and buyer name should be the same');
            setOpenError(true);
            return;
          }
        } else {
          if (state.section === state.buyerName) {
            setError('Section and buyer name should not be equal');
            setOpenError(true);
            return;
          }
        }
      }
      if (arr[i][0] === 'trayNo' || arr[i][0] === 'trayPrice') {
        if (!trayRegex.test(arr[i][1])) {
          setError('Tray price and amount cannot be negative or not a number');
          setOpenError(true);
          return;
        }
        if (noZeroRegex.test(arr[i][1])) {
          setError('Tray price and amount cannot be zero');
          setOpenError(true);
          return;
        }
      }
      if (arr[i][0] === 'extra_data' && !alphaNumRegex.test(arr[i][1])) {
        setError('Extra info should only be letters/numbers or left empty');
        setOpenError(true);
        return;
      }
    }
    let status = true;
    if (state.not_paid) {
      status = false;
    }
    const values = {
      ...state,
      name,
      status
    };
    delete values.not_paid;
    delete values.paid;
    if (!values.status && localStorage.getItem('name') !== values.receiver) {
      setError('Sale should be paid if money was transferred');
      setOpenError(true);
      return -1;
    }
    if (!values.status) values.receiver = '';
    values.receiver = values.receiver.toUpperCase()
    values.section = getSectionAddr(values.section);
    let date = new Date(values.date);
    date.setHours(0, 0, 0, 0);
    values.date = date;
    let proceed = parameterChecks(values);
    if (proceed) {
        db.collection('hashes').doc({ id: 1 }).get().then(document => {
          const leaves = document.hashes;
          const tree = new MerkleTree(leaves, SHA256);
          const root = tree.getRoot().toString('hex');
          const leaf = SHA256(`${values.buyerName.toUpperCase()}${values.date.getTime() / 1000}${values.section.toUpperCase()}`).toString();
          console.log(`${values.buyerName.toUpperCase()}${values.date.getTime() / 1000}${values.section.toUpperCase()}`)
          console.log(leaf);
          const proof = tree.getProof(leaf);
          const isAvail = tree.verify(proof, leaf, root);
          console.log(isAvail);
          if(isAvail) {
            setError('Entry already exists');
            setOpenError(true);
            setOpen(false);
          } else {
            props.inputSell(values);
            setOpenError(false);
            setOpen(true);
            setState({
              ...state,
              extra_data: ''
            });
          }
        });
    }
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
        section: e,
        buyerName: e
      });
    }
  };

  const handleTransfer = (e) => {
    setState({
      ...state,
      receiver: e.trim()
    });
  }

  const handleBuyer = (e) => {
    setState({
      ...state,
      buyerName: e
    });
  }

  const componentDidMount = () => {
    bsCustomFileInput.init();
  };
  useEffect(() => {
    componentDidMount();
  }, []);

  if (redirect) {
    return <Redirect to='/' />;
  }

  return (
    <div>
      <div className='page-header'>
        <h3 className='page-title'>Input Sales</h3>
        <nav aria-label='breadcrumb'>
          <ol className='breadcrumb'>
            <li className='breadcrumb-item'>
              <a
                style={{ textDecoration: 'none' }}
                href='/'
                onClick={(event) => {
                  event.preventDefault();
                  setRedirect(true);
                }}
              >
                Home
              </a>
            </li>
            <li className='breadcrumb-item active' aria-current='page'>
              Input Sales
            </li>
          </ol>
        </nav>
      </div>
      <div className='col-xl grid-margin stretch-card'>
        <div className='card'>
          <div className='card-body'>
            <h4 className='card-title'>Input Sale</h4>
            <p className='card-description'> Enter sales made </p>
            <form className='forms-sample'>
              <label htmlFor='date'>Date</label>
              <Form.Group>
                <DatePicker
                  selected={state.date}
                  onChange={handleDate}
                  className="form-control text-white"
                  id='date'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='section'>Section</label>
                <DropdownButton
                  alignRight
                  title={state.section || 'Choose Section'}
                  id='section'
                  onSelect={handleSelect}
                >
                  {sectionNames.map(x => {
                    return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                  })}
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey='Other Buyer'>
                    Other Buyer
                  </Dropdown.Item>
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor='buyerName'>Buyer Name</label>
                <DropdownButton
                    alignRight
                    title={state.buyerName || 'Choose Buyer Name'}
                    id='buyerName'
                    onSelect={handleBuyer}
                >
                  {buyerNames.map(x => {
                    return <Dropdown.Item eventKey={x}>{x}</Dropdown.Item>
                  })}
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor='trayNo'>Number of Trays</label>
                <Form.Control
                  type='text'
                  onChange={handleSelect}
                  value={state.trayNo}
                  className="form-control text-white"
                  id='trayNo'
                  placeholder='Number of Trays'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='trayPrice'>Price per Tray</label>
                <Form.Control
                  type='text'
                  onChange={handleSelect}
                  className="form-control text-white"
                  id='trayPrice'
                  placeholder='Price per Tray'
                  value={state.trayPrice}
                />
              </Form.Group>
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
                <label htmlFor='receiver'>Money transferred to</label>
                <DropdownButton
                    alignRight
                    title={state.receiver}
                    id='receiver'
                    onSelect={handleTransfer}
                >
                  <Dropdown.Item eventKey="Victor">Victor</Dropdown.Item>
                  <Dropdown.Item eventKey="Anne">Anne</Dropdown.Item>
                  <Dropdown.Item eventKey="Jeff">Jeff</Dropdown.Item>
                  <Dropdown.Item eventKey="Babra">Babra</Dropdown.Item>
                  <Dropdown.Item eventKey="Purity">Purity</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey="Bank">Bank</Dropdown.Item>
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor="extra_data">Extra info (optional)</label>
                <Form.Control type="text" onChange={handleSelect} className="form-control text-white" id="extra_data" placeholder="Any extra information" />
              </Form.Group>
              <button
                type='submit'
                className='btn btn-primary mr-2'
                onClick={handleSubmit}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
      <Online>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity='success'>
            Data Submitted
          </Alert>
        </Snackbar>
      </Online>
      <Offline>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert severity='warning'>
            Data will be submitted automatically when back online
          </Alert>
        </Snackbar>
      </Offline>
      <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity='error'>{error}</Alert>
      </Snackbar>
    </div>
  );
}

const mapDispatchToProps = (dispatch) => {
  return {
    inputSell: sale => dispatch(inputSell(sale))
  };
};

const mapStateToProps = function(state) {
  return {
    extraData: state.firestore.ordered.extra_data,
    trayCheck: state.firestore.ordered.trays
  }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
      {collection: 'extra_data', doc: 'extra_data'},
      {collection: 'trays', doc: 'exact'}
    ])
)(InputSell);
