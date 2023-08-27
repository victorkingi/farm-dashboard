import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import moment from 'moment';
import {Line} from 'react-chartjs-2';
import {Form} from "react-bootstrap";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import {Alert} from "../form-elements/InputEggs";
import Snackbar from "@material-ui/core/Snackbar";

function ChartJs(props) {
    const { dashboard } = props;

    const [isEgg, setIsEgg] = useState(true);
    const [period, setPeriod] = useState('week');
    const [chart, setChart] = useState('Laying Percent');
    const [chartType, setChartType] = useState('Total');
    const [dataSetWeekLayTotal, setDataSetWeekLayTotal] = useState({});
    const [dataSetWeekProfit, setDataSetWeekProfit] = useState({});
    const [dataSetMonthProfit, setDataSetMonthProfit] = useState({});
    const [dataSetWeekSec, setDataSetWeekSec] = useState({});
    const [dataSetDayLaySec, setDataSetDayLaySec] = useState({});
    const [dataSetDayLayTotal, setDataSetDayLayTotal] = useState({});
    const [dataSetMonthLaySec, setDataSetMonthLaySec] = useState({});
    const [dataSetMonthLayTotal, setDataSetMonthLayTotal] = useState({});
    const [dataSetMonthTray, setDataSetMonthTray] = useState({});
    const [dataSetWeekTray, setDataSetWeekTray] = useState({});
    const [dataSetDayTray, setDataSetDayTray] = useState({});
    const [error, setError] = useState('');
    const [openError, setOpenError] = useState(false);

    const [areaOptions, ] = useState({
        plugins: {
            filler: {
                propagate: true
            }
        },
        scales: {
            yAxes: [{
                gridLines: {
                    color: "rgba(204, 204, 204, 1)"
                }
            }],
            xAxes: [{
                gridLines: {
                    color: "rgba(204, 204, 204, 1)"
                }
            }]
        }
    });

    useEffect(() => {
        if (false) {
            const dayData_ = dashboard[0].trays_collected_to_timestamp;
            const weekTray_ = dashboard[0].week_trays_and_exact;
            const monthTray_ = dashboard[0].month_trays_and_exact;

            const weekExact_ = dashboard[0].week_laying_chart_exact; // laying
            const weekGiven_ = dashboard[0].week_laying_chart_given; // laying
            const weekLevel_ = dashboard[0].week_laying_chart_levels; // laying
            const weekProfit = dashboard[0].week_profit_chart;
            const monthProfit = dashboard[0].month_profit_chart;

            const exactY = [...weekExact_.y];
            const givenY = [...weekGiven_.y];
            const weekY = [...weekProfit.y];
            const monthY = [...monthProfit.y];
            const levelY = [];
            for (const levelData of Object.values(weekLevel_)) {
                const data_ = [...levelData.y];
                levelY.push({
                    label: levelData.label.slice(6),
                    data: data_,
                    backgroundColor: levelData.backgroundColor,
                    borderColor: levelData.borderColor,
                    borderWidth: 1,
                    fill: true, // 3: no fil
                });
            }
            let dayLevel_ = {
                a1: [], b1: [], c1: [], a2: [], b2: [],
                c2: [], a3: [], b3: [], c3: [], a4: [],
                b4: [], c4: [], exact: [], given: [],
                pexact: [], pgiven: [],
            };
            let weekTraysList = {exact: [], given: []};
            let monthLevel_ = {
                a1: [], b1: [], c1: [], a2: [], b2: [],
                c2: [], a3: [], b3: [], c3: [], a4: [],
                b4: [], c4: [], exact: [], given: [],
                pexact: [], pgiven: [],
            };
            let dayXAxis = [];
            for (const epoch of Object.keys(dayData_)) {
                dayXAxis.push(epoch);
            }
            let monthXAxis = [];
            for (const [epoch, val] of Object.entries(monthTray_)) {
                if (JSON.stringify(val) === '{}') continue;
                monthXAxis.push(epoch);
            }

            for (const vals of Object.values(dayData_)) {
                dayLevel_.exact.push(parseInt(vals.exact.split(',')[0]));
                dayLevel_.pexact.push(vals.percent_exact);
                dayLevel_.given.push(parseInt(vals.trays_collected.split(',')[0]));
                dayLevel_.pgiven.push(vals.percent_trays_collected);
                dayLevel_.a1.push(vals.a1);
                dayLevel_.a2.push(vals.a2);
                dayLevel_.a3.push(vals.a3);
                dayLevel_.a4.push(vals.a4);
                dayLevel_.b1.push(vals.b1);
                dayLevel_.b2.push(vals.b2);
                dayLevel_.b3.push(vals.b3);
                dayLevel_.b4.push(vals.b4);
                dayLevel_.c1.push(vals.c1);
                dayLevel_.c2.push(vals.c2);
                dayLevel_.c3.push(vals.c3);
                dayLevel_.c4.push(vals.c4);
            }

            for (const vals of Object.values(weekTray_)) {
                if (JSON.stringify(vals) === '{}') continue;
                weekTraysList.exact.push(parseInt(vals.exact?.split(',')[0] || 0));
                weekTraysList.given.push(parseInt(vals.trays_collected?.split(',')[0] || 0));
            }
            for (const vals of Object.values(monthTray_)) {
                if (JSON.stringify(vals) === '{}') continue;

                monthLevel_.exact.push(parseInt(vals.exact?.split(',')[0] || 0));
                monthLevel_.pexact.push(vals.percent_exact || 0);
                monthLevel_.given.push(parseInt(vals.trays_collected?.split(',')[0] || 0));
                monthLevel_.pgiven.push(vals.percent_given || 0);
                monthLevel_.a1.push(vals.a1 || 0);
                monthLevel_.a2.push(vals.a2 || 0);
                monthLevel_.a3.push(vals.a3 || 0);
                monthLevel_.a4.push(vals.a4 || 0);
                monthLevel_.b1.push(vals.b1 || 0);
                monthLevel_.b2.push(vals.b2 || 0);
                monthLevel_.b3.push(vals.b3 || 0);
                monthLevel_.b4.push(vals.b4 || 0);
                monthLevel_.c1.push(vals.c1 || 0);
                monthLevel_.c2.push(vals.c2 || 0);
                monthLevel_.c3.push(vals.c3 || 0);
                monthLevel_.c4.push(vals.c4 || 0);
            }

            const levelLayDataSet = [];
            const bacColor = [];
            const boColor = [];
            const mbacColor = [];
            const mboColor = [];
            for (const x of Object.keys(dayLevel_)) {
                if (x === 'pgiven' || x === 'pexact' || x === 'exact'
                || x === 'given') continue;

                for (let i = 0; i < dayLevel_[x].length; i++) {
                    bacColor.push(`rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`);
                    boColor.push(`rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`);
                }

                levelLayDataSet.push({
                    label: `${x}`,
                    data: dayLevel_[x],
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                });
            }
            const monthLevelLayDataSet = [];
            for (const x of Object.keys(monthLevel_)) {
                if (x === 'pgiven' || x === 'pexact' || x === 'exact'
                    || x === 'given') continue;

                for (let i = 0; i < monthLevel_[x].length; i++) {
                    mbacColor.push(`rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`);
                    mboColor.push(`rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`);
                }

                monthLevelLayDataSet.push({
                    label: `${x}`,
                    data: monthLevel_[x],
                    backgroundColor: mbacColor,
                    borderColor: mboColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                });
            }

            setDataSetDayTray({
                labels: dayXAxis.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: 'Daily Trays Exact',
                    data: dayLevel_.exact,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }, {
                    label: 'Daily Trays Given',
                    data: dayLevel_.given,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
            setDataSetDayLayTotal({
                labels: dayXAxis.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: 'Daily Percent Exact',
                    data: dayLevel_.pexact,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }, {
                    label: 'Daily Percent Given',
                    data: dayLevel_.pgiven,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
            setDataSetDayLaySec({
                labels: dayXAxis.map(k => moment.unix(k).format("ll")),
                datasets: levelLayDataSet
            });

            setDataSetWeekTray({
                labels: weekExact_.x.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: 'Weekly Trays Exact',
                    data: weekTraysList.exact,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }, {
                    label: 'Weekly Trays Given',
                    data: weekTraysList.given,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
            setDataSetWeekLayTotal({
                labels: weekExact_.x.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: weekExact_.label,
                    data: exactY,
                    backgroundColor: weekExact_.backgroundColor,
                    borderColor: weekExact_.borderColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }, {
                    label: weekGiven_.label,
                    data: givenY,
                    backgroundColor: weekGiven_.backgroundColor,
                    borderColor: weekGiven_.borderColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
            setDataSetWeekSec({
                labels: weekExact_.x.map(k => moment.unix(k).format("ll")),
                datasets: levelY
            });

            setDataSetMonthTray({
                labels: monthXAxis.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: 'Monthly Trays Exact',
                    data: monthLevel_.exact,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }, {
                    label: 'Monthly Trays Given',
                    data: monthLevel_.given,
                    backgroundColor: bacColor,
                    borderColor: boColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
            setDataSetMonthLayTotal({
                labels: monthXAxis.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: 'Month percent exact',
                    data: monthLevel_.pexact,
                    backgroundColor: mbacColor,
                    borderColor: mboColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }, {
                    label: 'Month percent given',
                    data: monthLevel_.pgiven,
                    backgroundColor: mbacColor,
                    borderColor: mboColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
            setDataSetMonthLaySec({
                labels: monthXAxis.map(k => moment.unix(k).format("ll")),
                datasets: monthLevelLayDataSet
            });

            setDataSetWeekProfit({
                labels: weekProfit.x.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: weekProfit.label,
                    data: weekY,
                    backgroundColor: weekProfit.backgroundColor,
                    borderColor: weekProfit.borderColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
            setDataSetMonthProfit({
                labels: monthProfit.x.map(k => moment.unix(k).format("ll")),
                datasets: [{
                    label: monthProfit.label,
                    data: monthY,
                    backgroundColor: monthProfit.backgroundColor,
                    borderColor: monthProfit.borderColor,
                    borderWidth: 1,
                    fill: true, // 3: no fill
                }]
            });
        }
    }, [dashboard]);

    useEffect(() => {
        if (chart === 'Laying Percent') setIsEgg(true);
        else setIsEgg(false);
        if (chart === 'Profit' && period === 'day') {
            setError("Day data for profit does not exist");
            setOpenError(true);
            setPeriod('week');
        }

    }, [chart, period]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenError(false);
    };

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">
                    Charts
                </h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a style={{textDecoration: 'none'}} href="!#" onClick={event => event.preventDefault()}>Charts</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Charts</li>
                    </ol>
                </nav>
            </div>
            <form className='forms-sample'>
                <label htmlFor=''>Choose chart to view</label>
                <Form.Group style={{display: 'flex'}}>
                    <DropdownButton
                        alignRight
                        title={period}
                        id=''
                        onSelect={(val) => setPeriod(val)}
                        style={{paddingRight: '2%'}}
                    >
                        <Dropdown.Item eventKey={"day"}>day</Dropdown.Item>
                        <Dropdown.Item eventKey={"week"}>week</Dropdown.Item>
                        <Dropdown.Item eventKey={"month"}>month</Dropdown.Item>
                    </DropdownButton>
                    <DropdownButton
                        alignRight
                        title={chart}
                        id='dropdown-menu-align-right'
                        onSelect={(val) => setChart(val)}
                        style={{paddingRight: '2%'}}
                    >
                        <Dropdown.Item eventKey={"Laying Percent"}>Laying Percent</Dropdown.Item>
                        <Dropdown.Item eventKey={"Trays Collected"}>Trays Collected</Dropdown.Item>
                        <Dropdown.Item eventKey={"Profit"}>Profit</Dropdown.Item>
                    </DropdownButton>
                    {isEgg &&
                        <DropdownButton
                        alignRight
                        title={chartType}
                        id='dropdown-menu-align-right'
                        onSelect={(val) => setChartType(val)}
                    >
                        <Dropdown.Item eventKey={"Sections"}>Sections</Dropdown.Item>
                        <Dropdown.Item eventKey={"Total"}>Total</Dropdown.Item>
                    </DropdownButton>
                    }
                </Form.Group>
            </form>
            {chart === 'Laying Percent' && period === 'week' && chartType === 'Sections' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Weekly Laying Percent each section</h4>
                                <Line data={dataSetWeekSec} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {chart === 'Laying Percent' && period === 'week' && chartType === 'Total' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Weekly Laying Percent Total, Exact to Given</h4>
                                <Line data={dataSetWeekLayTotal} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>}
            {chart === 'Laying Percent' && period === 'day' && chartType === 'Sections' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Daily Laying Percent each section</h4>
                                <Line data={dataSetDayLaySec} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {chart === 'Laying Percent' && period === 'day' && chartType === 'Total' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Daily Laying Percent Total, Exact to Given</h4>
                                <Line data={dataSetDayLayTotal} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {chart === 'Laying Percent' && period === 'month' && chartType === 'Sections' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body  bg-white">
                                <h4 className="card-title">Monthly Laying Percent each section</h4>
                                <Line data={dataSetMonthLaySec} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {chart === 'Laying Percent' && period === 'month' && chartType === 'Total' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Monthly Laying Percent Total, Exact to Given</h4>
                                <Line data={dataSetMonthLayTotal} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {chart === 'Trays Collected' && period === 'week' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Weekly Trays Collected, Exact to Given</h4>
                                <Line data={dataSetWeekTray} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>}
            {chart === 'Trays Collected' && period === 'day' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Daily Trays Collected, Exact to Given</h4>
                                <Line data={dataSetDayTray} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>}
            {chart === 'Trays Collected' && period === 'month' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Daily Trays Collected, Exact to Given</h4>
                                <Line data={dataSetMonthTray} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>}
            {chart === 'Profit' && period === 'week' &&
                <div className="row">
                <div className="col-md grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body bg-white">
                            <h4 className="card-title">Profit per Week</h4>
                            <Line data={dataSetWeekProfit} options={areaOptions}/>
                        </div>
                    </div>
                </div>
            </div>}
            {chart === 'Profit' && period === 'month' &&
                <div className="row">
                    <div className="col-md grid-margin stretch-card">
                        <div className="card">
                            <div className="card-body bg-white">
                                <h4 className="card-title">Profit per Month</h4>
                                <Line data={dataSetMonthProfit} options={areaOptions}/>
                            </div>
                        </div>
                    </div>
                </div>
            }
            <Snackbar open={openError} autoHideDuration={5000} onClose={handleClose}>
                <Alert severity='error'>{error}</Alert>
            </Snackbar>
        </div>
    )
}

const mapStateToProps = (state) => {
    return {
        dashboard: state.firestore.ordered.dashboard_data
    }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
        {collection: 'dashboard_data', doc: 'dashboard'}
    ])
)(ChartJs);
