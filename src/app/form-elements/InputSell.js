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
import Predictionary from 'predictionary';
import ed from 'edit-distance';

function autoCorrectBuyerName(entered, section) {
  let insert, remove, update;
  insert = remove = () => { return 1; };
  update = (stringA, stringB) => { return stringA !== stringB ? 1 : 0; };
  let predictionary = Predictionary.instance();
  const skip = ['Thika Farmers', 'Cakes', 'Duka'];
  const chosen = [
    'Eton',
    "Sang'",
    'Karithi',
    'Titus',
    'Mwangi',
    'Lynn',
    'Gituku',
    "Lang'at",
    'Wahome',
    'Kamau',
    'Wakamau',
    'Simiyu',
    'Kinyanjui',
    'Benson',
    'Ben',
    'Rose',
    'Gitonyi',
    'Muthomi',
    'Solomon'
  ];
  predictionary.addWords(chosen);
  if (skip.includes(entered) && section !== getSectionAddr(entered)) return {entered};
  else if (skip.includes(entered) && section === getSectionAddr(entered)) return entered;
  const final = [];
  for (let k in chosen) {
    const chose = chosen[k];
    const lev = ed.levenshtein(entered, chose, insert, remove, update);
    if (lev.distance < 3) final.push(chose);
  }
  let suggestions = predictionary.predict(entered);
  final.push(...suggestions);
  let ans;
  for (let k in final) {
    const chose = final[k];
    const lev = ed.levenshtein(entered, chose, insert, remove, update);
    if (lev.distance < 3) ans = chose;
  }
  return ans;
}

function InputSell(props) {
  const [state, setState] = useState({
    date: new Date(),
    section: 'Choose Section',
    buyerName: '',
    trayPrice: '300'
  });
  const [open, setOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');
  const [defPaid, setDefPaid] = useState(false);
  let name = firebase.auth().currentUser?.displayName;
  name = name ? name.substring(0, name.lastIndexOf(' '))
      .toUpperCase() : '';

  useEffect(() => {
    if (state.section === 'Thika Farmers' || state.section === 'Duka') {
      setDefPaid(true);
    } else {
      setDefPaid(false);
    }
  }, [state, name]);

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
    if (
      (values.section === 'THIKA_FARMERS' || values.section === 'DUKA') &&
      !JSON.parse(values.status)
    ) {
      setError('Thika Farmers and duka are always paid');
      setOpenError(true);
      return false;
    }
    if (!values.section) {
      setError('Section is empty!');
      setOpenError(true);
      return false;
    }
    if (values.trayNo < 1 || values.trayPrice < 1) {
      setError('Tray price and number cannot be negative / 0');
      setOpenError(true);
      return false;
    }
    if (!values.name) {
      setError('User undefined');
      setOpenError(true);
      return false;
    }
    let proceed = checkDate(values.date);
    if (values.buyerName && proceed) {
      values.buyerName = values.buyerName
        .charAt(0)
        .toUpperCase()
        .concat(values.buyerName.substring(1));
      return true;
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const arr = Object.entries(state);
    const trayRegex = /^([\d]+)$/;
    const noZeroRegex = /^(0*)$/;

    if (arr.length < 5) {
      setError('All Inputs should be filled');
      setOpenError(true);
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][1] === '') {
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
          setError('Tray price and amount cannot be negative');
          setOpenError(true);
          return;
        }
        if (noZeroRegex.test(arr[i][1])) {
          setError('Tray price and amount cannot be zero');
          setOpenError(true);
          return;
        }
      }
    }
    let status = true;
    if (state.not_paid) {
      status = false;
    }
    const values = {
      ...state,
      name,
      status,
      replaced: !!state.replaced
    };
    delete values.not_paid;
    delete values.paid;
    values.category = 'sales';
    values.section = getSectionAddr(values.section);
    values.buyerName = values.buyerName
      .charAt(0)
      .toUpperCase()
      .concat(values.buyerName.substring(1));
    let date = new Date(values.date);
    date.setHours(0, 0, 0, 0);
    values.date = date;
    let proceed = parameterChecks(values);
    if (proceed) {
      const returned = autoCorrectBuyerName(values.buyerName, values.section);
      if (typeof returned === 'string') {
        values.buyerName = returned;
        props.inputSell(values, false);
        setOpenError(false);
        setOpen(true);
      } else {
        props.inputSell(values, true);
        setError('New buyer detected, this issue will be reported');
        setOpenError(true);
      }
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
                  className='form-control'
                  id='date'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='section'>Section</label>
                <DropdownButton
                  alignRight
                  title={state.section || 'Choose Section'}
                  id='dropdown-menu-align-right'
                  onSelect={handleSelect}
                >
                  <Dropdown.Item eventKey='Thika Farmers'>
                    Thika Farmers
                  </Dropdown.Item>
                  <Dropdown.Item eventKey='Cakes'>Cakes</Dropdown.Item>
                  <Dropdown.Item eventKey='Duka'>Duka</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item eventKey='Other Buyer'>
                    Other Buyer
                  </Dropdown.Item>
                </DropdownButton>
              </Form.Group>
              <Form.Group>
                <label htmlFor='buyerName'>Buyer Name</label>
                <Form.Control
                  type='text'
                  onChange={handleSelect}
                  className='form-control'
                  id='buyerName'
                  placeholder='Name of Buyer'
                  value={state.buyerName}
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='trayNo'>Number of Trays</label>
                <Form.Control
                  type='number'
                  onChange={handleSelect}
                  className='form-control'
                  id='trayNo'
                  placeholder='Number of Trays'
                />
              </Form.Group>
              <Form.Group>
                <label htmlFor='trayPrice'>Price per Tray</label>
                <Form.Control
                  type='number'
                  onChange={handleSelect}
                  className='form-control'
                  id='trayPrice'
                  placeholder='Price per Tray'
                  value={state.trayPrice}
                />
              </Form.Group>
              <div className='col-md-6'>
                <Form.Group>
                  <div className='form-check'>
                    <label htmlFor='1' className='form-check-label'>
                      <input
                        disabled={defPaid}
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
                        disabled={defPaid}
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
              </div>
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
          <Alert onClose={handleClose} severity='success'>
            Data Submitted
          </Alert>
        </Snackbar>
      </Online>
      <Offline>
        <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
          <Alert onClose={handleClose} severity='warning'>
            Data will be submitted automatically when back online
          </Alert>
        </Snackbar>
      </Offline>
      <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity='error'>{error}!</Alert>
      </Snackbar>
    </div>
  );
}

const mapDispatchToProps = (dispatch) => {
  return {
    inputSell: (sale, isUnknownBuyer) => dispatch(inputSell(sale, isUnknownBuyer))
  };
};

export default connect(null, mapDispatchToProps)(InputSell);
