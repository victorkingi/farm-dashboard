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

    useEffect(() => {
        if (dash) {
            const dboard = dash.dashboard;
            const age = dboard.birds_age;
            setStartDate(age.start_date.unix);
            const createRow = (desc, qty) => {
                return { desc, qty };
            }
            const tempRows = [];
            tempRows.push(createRow('Birds Age(weeks)', age.age.weeks));
            tempRows.push(createRow('Birds Age(months)', age.age.months));
            tempRows.push(createRow('Net profit', 'Ksh '+numeral(dboard.net_profit).format('0,0')));
            tempRows.push(createRow('Soft loan(From Jeff)', 'Ksh '+numeral(dboard.soft_loan).format('0,0')));
            tempRows.push(createRow('Total Earned(includes sales not paid)', 'Ksh '+numeral(dboard.total_earned).format('0,0')));
            tempRows.push(createRow('Total Spent(without the soft loan)', 'Ksh '+numeral(dboard.total_spent-dboard.soft_loan).format('0,0')));
            //tempRows.push(createRow('Sales Amount Not Settled', 'Ksh '+numeral(dboard.total_late_amt[0]).format('0,0')+' ('+numeral(dboard.total_late_trays).format('0,0')+' Trays)'));
            //tempRows.push(createRow('Purchases Amount Not Settled', 'Ksh '+numeral(dboard.total_late_amt[1]).format('0,0')));
            //tempRows.push(createRow('Total Sale Entries Pending Payment', numeral(dboard.total_late_orders[0]).format('0,0')));
            //tempRows.push(createRow('Total Purchase Entries Pending Payment', numeral(dboard.total_late_orders[1]).format('0,0')));
            tempRows.push(createRow('Total Sales Completed', numeral(dboard.total_orders).format('0,0')));
            tempRows.push(createRow('Total Trays sold(Including sales not paid)', numeral(dboard.total_trays_sold).format('0,0')));


            tempRows.push(...Object.entries(dboard.aggr_late)
                .map(item => createRow(`${item[0].endsWith('OTHER') 
                    ? ((item[0][0] === 'S' && 'Other sales') 
                        || (item[0][0] === 'P' && 'Other purchases')) 
                    : item[0].charAt(0)+item[0].slice(1).toLowerCase()} not paid`, item[0] !== 'FEEDS' ?
                    'Ksh '+numeral(item[1][1]).format('0,0')+' ('+numeral(item[1][0]).format('0,0')+' Trays)' : 'Ksh '+numeral(item[1][1]).format('0,0'))));
            tempRows.push(...Object.entries(dboard.last_paid_date)
                .map(item => createRow(`${item[0].charAt(0)+item[0].slice(1).toLowerCase()} last paid month`,
                    item[1].toLowerCase())));
            tempRows.push(...Object.entries(dboard.other_debts)
                .map(item => createRow(`Debt: ${item[0].split('OWE_')[1].split('_').join(' ').toLowerCase()}`,
                    item[0].includes('JEFF') ? 'Ksh '+numeral(item[1] - dboard.owe.JEFF).format('0,0') : 'Ksh '+numeral(item[1]).format('0,0'))));
            tempRows.push(...Object.entries(dboard.pair_bals)
                .map(item => createRow(`Pairing debt: ${item[0]}`,
                    'Ksh '+numeral(item[1]).format('0,0'))));
            setRows(tempRows);
        }
    }, [dash]);

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
                            <TableCell align="right" colSpan={100}>{String(row.qty).endsWith('Trays)') ? (
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
