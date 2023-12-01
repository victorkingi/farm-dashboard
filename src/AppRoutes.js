import React, {Suspense, lazy} from 'react';
import { Switch, Route } from 'react-router-dom';

import Spinner from './app/shared/Spinner';

const Dashboard = lazy(() => import('./app/dashboard/Dashboard'));

const InputTrays = lazy(() => import('./app/form-elements/InputTrays'));
const InputSell = lazy(() => import('./app/form-elements/InputSell'));
const InputExpenses = lazy(() => import('./app/form-elements/InputExpenses'));
const InputMoney = lazy(() => import('./app/form-elements/InputMoney'));
const InputDeadSick = lazy(() => import('./app/form-elements/InputDeadSick'));
const InputEggs = lazy(() => import('./app/form-elements/InputEggs'));
const InputChickenNo = lazy(() => import('./app/form-elements/InputChickenNo'));
const DInvoice = lazy(() => import('./app/form-elements/DInvoice'));
const DReport = lazy(() => import('./app/form-elements/DReport'));

const LatePayment = lazy(() => import('./app/tables/LatePayment'));
const BasicTable = lazy(() => import('./app/tables/BasicTable'));

const ChartJs = lazy(() => import('./app/charts/ChartJs'));

const Error404 = lazy(() => import('./app/error-pages/Error404'));
const Error500 = lazy(() => import('./app/error-pages/Error500'));

const Login = lazy(() => import('./app/user-pages/Login'));

function AppRoutes() {
    return (
      <Suspense fallback={<Spinner/>}>
        <Switch>
          <Route exact path="/" component={ Dashboard } />

          <Route path="/inputs/trays" component={ InputTrays } />
          <Route path="/inputs/sale" component={ InputSell } />
          <Route path="/inputs/ds" component={ InputDeadSick } />
          <Route path="/inputs/expenses" component={ InputExpenses } />
          <Route path="/inputs/eggs" component={ InputEggs } />
          <Route path="/inputs/chknno" component={ InputChickenNo } />
          <Route path="/inputs/money" component={ InputMoney } />

          <Route path="/downloads/invoice" component={ DInvoice }/>
          <Route path="/downloads/report" component={ DReport }/>

          <Route path="/tables/late" component={ LatePayment } />
          <Route path="/tables/entries" component={ BasicTable } />

          <Route path="/charts/chart-js" component={ ChartJs } />

          <Route path="/user-pages/login-1" component={ Login } />

          <Route path="/error-pages/error-404" component={ Error404 } />
          <Route path="/error-pages/error-500" component={ Error500 } />
          <Route path="*" component={Error404} status={404}/>
        </Switch>
      </Suspense>
    );
}

export default AppRoutes;
