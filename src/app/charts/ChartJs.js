import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import moment from 'moment';
import {Line} from 'react-chartjs-2';

function ChartJs(props) {
    const { dashboard } = props;

    const [dataset1, setDataSet1] = useState({});
    const [dataset2, setDataSet2] = useState({});
    const [dataset3, setDataSet3] = useState({});

    const [areaOptions, ] = useState({
        plugins: {
            filler: {
                propagate: true
            }
        },
        scales: {
            yAxes: [{
                gridLines: {
                    color: "rgba(204, 204, 204,0.1)"
                }
            }],
            xAxes: [{
                gridLines: {
                    color: "rgba(204, 204, 204,0.1)"
                }
            }]
        }
    });

    useEffect(() => {
        if (dashboard) {
            const weekExact_ = dashboard[0].week_laying_chart_exact;
            const weekGiven_ = dashboard[0].week_laying_chart_given;
            const weekProfit = dashboard[0].week_profit_chart;
            const monthProfit = dashboard[0].month_profit_chart;
            const exactY = [...weekExact_.y];
            const givenY = [...weekGiven_.y];
            const weekY = [...weekProfit.y];
            const monthY = [...monthProfit.y];

            setDataSet1({
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
            setDataSet2({
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
            setDataSet3({
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

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">
                    Charts
                </h3>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="!#" onClick={event => event.preventDefault()}>Charts</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Charts</li>
                    </ol>
                </nav>
            </div>
            <div className="row">
                <div className="col-md grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Laying Percentage per Week, Exact to Given</h4>
                            <Line data={dataset1} options={areaOptions} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Profit per Week</h4>
                            <Line data={dataset2} options={areaOptions} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Profit per Month</h4>
                            <Line data={dataset3} options={areaOptions} />
                        </div>
                    </div>
                </div>
            </div>
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
        {collection: 'dashboard_data'}
    ])
)(ChartJs);
