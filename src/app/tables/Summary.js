import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {compose} from "redux";
import {connect} from "react-redux";
import {firestoreConnect} from "react-redux-firebase";
import {useEffect, useState} from "react";
import moment from 'moment';
import numeral from "numeral";

function SpanningTable({ dash }) {
    const [startDate, setStartDate] = useState(0);
    const [rows, setRows] = useState([]);

    if (true)
        return <div />

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 1 }} aria-label="spanning table">
                <TableHead>
                    <TableRow>
                        <TableCell align="center" colSpan={100}>
                            <strong>Start Date: {moment(startDate*1000).format('dddd MMM Do YY')}</strong>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell align="right" colSpan={100}><strong>Number</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.desc}>
                            <TableCell>{row.desc}</TableCell>
                            <TableCell align="right" colSpan={100}>{
                                String(row.qty).endsWith('Trays)') || String(row.qty).endsWith('Months)') ? (
                                <div>
                                    {row.qty.split(' (')[0]}<b>{row.qty.slice(row.qty.indexOf(' ('))}</b>
                                </div>
                            ) : row.qty}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

const mapStateToProps = function(state) {
    return {
        dash: state.firestore.data.dashboard_data
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'dashboard_data', doc: 'dashboard'},
    ])
)(SpanningTable);
