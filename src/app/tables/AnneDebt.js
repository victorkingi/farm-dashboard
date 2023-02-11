import React, {useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import {connect} from 'react-redux';
import {compose} from 'redux'
import {firestoreConnect} from 'react-redux-firebase';
import {Redirect} from "react-router-dom";
import {hasPaidLate} from "../../services/actions/moneyAction";
import numeral from 'numeral';
import {Offline, Online} from "react-detect-offline";
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from "../form-elements/InputEggs";

const useRowStyles = makeStyles({
    root: {
        '& > *': {
            borderBottom: 'unset',
        },
    },
});

function Row(props) {
    const { row } = props;
    const [open, setOpen] = React.useState(false);
    const classes = useRowStyles();
    let total = 0;
    let tray_no = 0;

    const getTotal = (historyRow) => {
        total += parseFloat(historyRow.amount) * parseFloat(historyRow.tPrice);
        tray_no += parseInt(historyRow.amount);
    }

    return (
        <React.Fragment>
            <TableRow className={classes.root}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {row.month}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            <Typography variant="h6" gutterBottom component="div">
                                History
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Tray No</TableCell>
                                        <TableCell align="right">Price per Tray</TableCell>
                                        <TableCell align="right">Total Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.history.map((historyRow) => (
                                        <TableRow key={historyRow.date}>
                                            <TableCell component="th" scope="row">
                                                {historyRow.date}
                                            </TableCell>
                                            <TableCell align="right">{historyRow.amount}</TableCell>
                                            <TableCell align="right">{historyRow.tPrice}</TableCell>
                                            <TableCell align="right">
                                                {numeral(historyRow.amount * historyRow.tPrice).format("0,0")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        {row.history.map((historyRow) => (
                                            getTotal(historyRow)
                                        ))}
                                        <TableCell component="th" scope="row">
                                            <b><em>Subtotal</em></b>
                                        </TableCell>
                                        <TableCell align="right"><b>{tray_no}</b></TableCell>
                                        <TableCell align="right" />
                                        <TableCell align="right">
                                            <b><em>Ksh.{numeral(total).format("0,0")}</em></b>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

Row.propTypes = {
    row: PropTypes.shape({
        history: PropTypes.arrayOf(
            PropTypes.shape({
                amount: PropTypes.number.isRequired,
                date: PropTypes.string.isRequired,
            }),
        ).isRequired,
        month: PropTypes.string.isRequired
    }).isRequired,
};

const mapStateToProps = function (state) {
    return {
        pending: state.firestore.ordered.late_payment
    }
}

const mapDispatchToProps = (dispatch) => {

    return {
        hasPaidLate: (allKeys, isOne, isDebt, buyers, items, payers) => dispatch(hasPaidLate(allKeys, isOne, isDebt, buyers, items, payers))
    }
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect([
        {collection: 'late_payment', where: ['values.section', '==', 'CAKES']}
    ])
)(function AnneDebt(props) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const [errM, setErrM] = useState('');

    const user = useMemo(function() {
        const __user = localStorage.getItem('user') || false;

        return {__user};
    }, []);

    if (!user.__user) {
        return (
            <Redirect to="/user-pages/login-1"/>
        )
    }
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setError(false);
        setErrM('');
        setOpen(false);
    };

    const handleClick = async () => {
        const submit = document.getElementById("submit");
        submit.disabled = true;
        for (let i = 0; i < props.pending?.length; i++) {
            if (props.pending[i].values.section === "CAKES" && props.pending[i].skip !== true) {
                const tray_no = parseInt(props.pending[i].values.tray_no);
                const tray_price = parseInt(props.pending[i].values.tray_price);

                const res = await props.hasPaidLate([props.pending[i].id], true, false, false, false, `BANK:${tray_no*tray_price},`);
                let fres = res.reduce((a, b) => a === b, 'ok');
                if (fres) {
                    setError(false);
                    setOpen(true);
                } else {
                    setOpen(false);
                    setErrM("Entry no longer exists");
                    setError(true);
                    return 0;
                }
            }
        }
        setOpen(true);
    }
    const getValues = () => {
        const arr = []
        for (let i = 0; i < props.pending?.length; i++) {
            arr.push(props.pending[i].values);
        }
        return arr.sort((a, b) => a.date.toDate() - b.date.toDate());
    }
    function createData() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const fin_ar = [];
        let history = [];
        let total = 0;
        const used = getValues();
        for (let p = 0; p < 12; p++) {
            for (let i = 0; i < used.length; i++) {
                if (used[i].date.toDate().getMonth() === p) {
                    const getDate = used[i].date.toDate().toLocaleDateString();
                    history.push({
                        date: getDate,
                        amount: parseInt(used[i].tray_no),
                        tPrice: parseFloat(used[i].tray_price)
                    });
                    total += parseFloat(used[i].tray_price) * parseInt(used[i].tray_no);
                }
            }
            if (history.length > 0) {
                fin_ar.push({
                    month: monthNames[p],
                    history,
                });
            }
            history = [];
        }
        return {
            fin_ar,
            total
        }
    }

    const rows = createData();

    if (props.pending?.length >= 0) {
        return (
            <div style={{paddingLeft: "3%", paddingRight: "3%", paddingTop: "10px" }}>
                <TableContainer style={{
                    borderRadius: "10px",
                    boxShadow: "0 6px 18px -9px rgba(0, 0, 0, 0.75)"
                }} component={Paper}>
                    {props.pending.length ? (
                        <div>
                            <Table aria-label="collapsible table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell/>
                                        <TableCell>Month ({props.pending[0].values.date.toDate().getFullYear()})</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.fin_ar.map((row) => (
                                        <Row key={row.month} row={row}/>
                                    ))}
                                </TableBody>
                            </Table>
                            <Table aria-label="collapsible table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="left">
                                            <b><em>Total:</em></b>
                                        </TableCell>
                                        <TableCell align="right">
                                            <b><em>Ksh.{numeral(rows.total).format("0,0")}</em></b>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                </TableBody>
                            </Table>
                        </div>
                    ) : <Table aria-label="collapsible table">
                        <TableHead>
                            <TableRow>
                                <TableCell/>
                                <TableCell>Month</TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>}
                </TableContainer>
                <div style={{paddingLeft: "35%", paddingTop: "10px"}}>
                    <button type="button" disabled={false} className="btn btn-primary" onClick={handleClick} id='submit'>
                        Payment Received
                    </button>
                </div>
                <Online>
                    <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                        <Alert onClose={handleClose} severity="success">
                            Accepted and moved
                        </Alert>
                    </Snackbar>
                </Online>
                <Offline>
                    <Snackbar
                        open={open} autoHideDuration={5000}
                        onClose={handleClose}
                        key={'topcenter'}>
                        <Alert onClose={handleClose} severity="warning">
                            Accepted. Will be moved when back online
                        </Alert>
                    </Snackbar>
                </Offline>
                <Snackbar open={error} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity="error">
                        {errM}
                    </Alert>
                </Snackbar>
            </div>
        );
    }
    return <div />
});
