import React, {useEffect, useState} from 'react'
import EnhancedTable from "./BalancesTable";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { Form } from 'react-bootstrap';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import numeral from 'numeral';

function BasicTable({ accounts }) {
    const [state, setState] = useState(localStorage.getItem('name'));
    const [bal, setBal] = useState(0);

    useEffect(() => {
        if (accounts) {
            if(state.toUpperCase() in accounts[0]) setBal(accounts[0][state.toUpperCase()])
            else console.log("not present", state.toUpperCase());
        }
    }, [state, accounts]);

    const handleSelect = (val) => {
        setState(val);
    }

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">All Balances</h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="!#" onClick={event => event.preventDefault()}>Tables</a></li>
                        <li className="breadcrumb-item active" aria-current="page">All Balances</li>
                    </ol>
                </nav>
            </div>
            <div className="row">
                <div className='col-xl grid-margin stretch-card'>
                    <div className='card'>
                        <div className='card-body'>
                            <h4 className='card-title'>Choose User</h4>
                            <form className='forms-sample'>
                                <Form.Group>
                                    <label htmlFor='section'>User</label>
                                    <DropdownButton
                                        alignRight
                                        title={state || 'Choose User'}
                                        id='dropdown-menu-align-right'
                                        onSelect={handleSelect}
                                    >
                                        <Dropdown.Item eventKey='Victor'>Victor</Dropdown.Item>
                                        <Dropdown.Item eventKey='Purity'>Purity</Dropdown.Item>
                                        <Dropdown.Item eventKey='Babra'>Babra</Dropdown.Item>
                                        <Dropdown.Item eventKey='Jeff'>Jeff</Dropdown.Item>
                                        <Dropdown.Item eventKey='Anne'>Anne</Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item eventKey='Bank'>Bank</Dropdown.Item>
                                    </DropdownButton>
                                </Form.Group>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col-sm-4 grid-margin">
                    <div className="card">
                        <div className="card-body">
                            <h5>{state}'s Balance</h5>
                            <div className="row">
                                <div className="col-8 col-sm-12 col-xl-8 my-auto">
                                    <div className="d-flex d-sm-block d-md-flex align-items-center">
                                        <h2 className="mb-0">Ksh. {numeral(bal).format("0,0")}</h2>
                                        <p className="text-success ml-2 mb-0 font-weight-medium">+0.0%</p>
                                    </div>
                                </div>
                                <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                                    <i className="icon-lg mdi mdi-codepen text-primary ml-auto"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <EnhancedTable to_use={state} />
        </div>
    )
}

const mapStateToProps = (state) => {
    return {
        accounts: state.firestore.ordered.accounts
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'accounts', doc: 'accounts'}
    ])
)(BasicTable);
