import React, {useEffect, useMemo, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import moment from 'moment';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

function createData(name, date, subm, status, hash) {
    return {
        name,
        date,
        subm,
        status,
        hash,
    };
}

function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) {
            return order;
        }
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

const headCells = [
    {
        id: 'name',
        numeric: false,
        disablePadding: true,
        label: 'Type',
    },
    {
        id: 'date',
        numeric: true,
        disablePadding: false,
        label: 'Date',
    },
    {
        id: 'subm',
        numeric: true,
        disablePadding: false,
        label: 'Submitted On',
    },
    {
        id: 'status',
        numeric: true,
        disablePadding: false,
        label: 'Status',
    },
    {
        id: 'hash',
        numeric: true,
        disablePadding: false,
        label: 'Hash',
    },
];

function EnhancedTableHead(props) {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } =
        props;
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all desserts',
                        }}
                    />
                </TableCell>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

EnhancedTableHead.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

const EnhancedTableToolbar = (props) => {
    const { numSelected } = props;

    return (
        <Toolbar
            sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                ...(numSelected > 0 && {
                    bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                }),
            }}
        >
            {numSelected > 0 ? (
                <Typography
                    sx={{ flex: '1 1 100%' }}
                    color="inherit"
                    variant="subtitle1"
                    component="div"
                >
                    {numSelected} selected
                </Typography>
            ) : (
                <Typography
                    sx={{ flex: '1 1 100%' }}
                    variant="h6"
                    id="tableTitle"
                    component="div"
                >
                    Entries
                </Typography>
            )}

            {numSelected > 0 ? (
                <Tooltip title="Delete">
                    <IconButton  onClick={() => {
                        window.alert("Not implemented yet");
                    }}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="Filter list">
                    <IconButton>
                        <FilterListIcon />
                    </IconButton>
                </Tooltip>
            )}
        </Toolbar>
    );
};

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
};
let __user = localStorage.getItem('name');
if(__user) __user = __user.toUpperCase();

function EnhancedTable(props) {
    const { to_use, firestore } = props;

    const [order, setOrder] = useState('desc');
    const [txs, setTxs] = useState({});
    const [orderBy, setOrderBy] = useState('date');
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(0);
    const [dense, setDense] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [rows, setRows] = useState([]);
    const [txWatch, setTxWatch] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useMemo(() => {
        const temp = []
        let local_txs = {}

        for (let tx of Object.entries(txWatch)) {
            tx = tx[1];
            if (tx.data.from === to_use.toUpperCase() || tx.data.to === to_use.toUpperCase()) {
                local_txs = {
                    ...local_txs,
                    [tx.hash]: tx
                };
                temp.push(createData(tx.type, tx.date, tx.submitted_on, tx.status, tx.hash));
            }
        }
        setTxs(local_txs);
        setRows(temp);
    }, [to_use, txWatch]);

    useMemo(() => {
        setPage(Math.floor(rows.length / rowsPerPage) < page ? Math.floor(rows.length / rowsPerPage) : page);

        // eslint-disable-next-line
    }, [rows.length]);

    useEffect(() => {
        let isSubscribed = true;

        // declare the async data fetching function
        const fetchData = async () => {
            // get the data
            const dataDocsFrom = await firestore.get({ collection: 'tx_ui', where: [['type', '==', 'Trade'], ['data.from', '==', to_use.toUpperCase()]] });
            const dataDocsTo = await firestore.get({ collection: 'tx_ui', where: [['type', '==', 'Trade'], ['data.to', '==', to_use.toUpperCase()]] });
            console.log("got", to_use);

            // set state with the result if `isSubscribed` is true
            if(isSubscribed) {
                console.log("check1", dataDocsTo.size, dataDocsFrom.size);
                const data = [];
                dataDocsFrom.docs.forEach((tx) => {
                    data.push(tx.data());
                });

                dataDocsTo.docs.forEach((tx_) => {
                    data.push(tx_.data());
                });
                setTxWatch(data);
                setIsLoading(false);
            }
        }

        setIsLoading(true);
        fetchData().catch(console.error);

        return () => isSubscribed = false;

        // eslint-disable-next-line
    }, [to_use]);

    console.log(to_use, txWatch);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = rows.map((n) => n.hash);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, name) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChangeDense = (event) => {
        setDense(event.target.checked);
    };

    const isSelected = (name) => selected.indexOf(name) !== -1;

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2 }}>
                <EnhancedTableToolbar numSelected={selected.length} />
                <TableContainer>
                    <Table
                        sx={{ minWidth: 750 }}
                        aria-labelledby="tableTitle"
                        size={dense ? 'small' : 'medium'}
                    >
                        <EnhancedTableHead
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {/* if you don't need to support IE11, you can replace the `stableSort` call with:
                 rows.slice().sort(getComparator(order, orderBy)) */}
                            {stableSort(rows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    const isItemSelected = isSelected(row.hash);
                                    const labelId = `enhanced-table-checkbox-${index}`;

                                    return (
                                        <TableRow
                                            hover
                                            onClick={(event) => handleClick(event, row.hash)}
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            key={row.hash}
                                            selected={isItemSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    checked={isItemSelected}
                                                    inputProps={{
                                                        'aria-labelledby': labelId,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell
                                                component="th"
                                                id={labelId}
                                                scope="row"
                                                padding="none"
                                            >
                                                {row.name}
                                            </TableCell>
                                            <TableCell align="right">{moment.unix(row.date).format("ddd ll")}</TableCell>
                                            <TableCell align="right">{moment.unix(row.subm).format("ddd ll")}</TableCell>
                                            <TableCell align="right">{row.status === 1 ? 'confirmed' : 'unconfirmed'}</TableCell>
                                            <TableCell align="right">{row.hash.slice(0, 5)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            {emptyRows > 0 && (
                                <TableRow
                                    style={{
                                        height: (dense ? 33 : 53) * emptyRows,
                                    }}
                                >
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
                { isLoading && <LinearProgress color="secondary"/> }
            </Paper>
            <FormControlLabel
                control={<Switch checked={dense} onChange={handleChangeDense} />}
                label="Dense padding"
            />
            {selected.map((item) => {
                const prevValues = txs[item].data.prev_values;
                return (
                    <div key={item}>
                        <Card variant="outlined">
                            <React.Fragment>
                                <CardContent>
                                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Trade: {item.slice(0, 5)}
                                        <br />
                                        Date: {txs[item].data.date.locale.slice(0,20)}
                                    </Typography>
                                    <Typography variant="h5" component="div">
                                        {txs[item].data.sale_hash === '' &&  txs[item].data.purchase_hash === '' ? 'Physical Trade' : `Tied to the ${txs[item].data.sale_hash !== '' ? `sale at ${txs[item].data.sale_hash.slice(0, 5)}` : `purchase at ${txs[item].data.purchase_hash.slice(0, 5)}`}`}
                                    </Typography>
                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                        From: {txs[item].data.from.toLowerCase()}
                                        <br />
                                        To: {txs[item].data.to.toLowerCase()}
                                        <br />
                                        Amount traded: Ksh. {Number.isInteger(txs[item].data.amount) ? numeral(txs[item].data.amount).format("0,0") : numeral(txs[item].data.amount).format("0,0.00")}
                                        <br />
                                        {txs[item].data.reason !== '' && txs[item].data.reason.toLowerCase()}
                                    </Typography>
                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                        {JSON.stringify(prevValues) !== '{}' && JSON.stringify(prevValues)}
                                    </Typography>
                                    <Typography variant="body2">
                                        Submitted by {txs[item].data.by.toLowerCase()}
                                    </Typography>
                                </CardContent>
                            </React.Fragment>
                        </Card>
                        <br />
                    </div>
                )
            })}
        </Box>
    );
}


export default compose(
    connect(),
    firestoreConnect([])
)(EnhancedTable);
