import React, {Suspense, lazy} from 'react';
import { Switch, Route } from 'react-router-dom';

import Spinner from './app/shared/Spinner';

const Dashboard = lazy(() => import('./app/dashboard/Dashboard'));

const Buttons = lazy(() => import('./app/basic-ui/Buttons'));
const Dropdowns = lazy(() => import('./app/basic-ui/Dropdowns'));
const Typography = lazy(() => import('./app/basic-ui/Typography'));

const InputSell = lazy(() => import('./app/form-elements/InputSell'));
const InputPurchase = lazy(() => import('./app/form-elements/InputPurchase'));
const InputMoney = lazy(() => import('./app/form-elements/InputMoney'));
const InputDeadSick = lazy(() => import('./app/form-elements/InputDeadSick'));
const InputBorrowed = lazy(() => import('./app/form-elements/InputBorrowed'));
const InputEggs = lazy(() => import('./app/form-elements/InputEggs'));
const Withdraw = lazy(() => import('./app/form-elements/Withdraw'));

const AnneDebt = lazy(() => import('./app/tables/AnneDebt'));
const LatePayment = lazy(() => import('./app/tables/LatePayment'));
const BasicTable = lazy(() => import('./app/tables/BasicTable'));
const BalancesBasicTable = lazy(() => import('./app/tables/BalancesBasicTable'));

const Mdi = lazy(() => import('./app/icons/Mdi'));

const ChartJs = lazy(() => import('./app/charts/ChartJs'));

const Error404 = lazy(() => import('./app/error-pages/Error404'));
const Error500 = lazy(() => import('./app/error-pages/Error500'));

const Login = lazy(() => import('./app/user-pages/Login'));
const Register1 = lazy(() => import('./app/user-pages/Register'));

function AppRoutes() {
    return (
      <Suspense fallback={<Spinner/>}>
        <Switch>
          <Route exact path="/" component={ Dashboard } />

          <Route path="/basic-ui/buttons" component={ Buttons } />
          <Route path="/basic-ui/dropdowns" component={ Dropdowns } />
          <Route path="/basic-ui/typography" component={ Typography } />

          <Route path="/inputs/sale" component={ InputSell } />
          <Route path="/inputs/ds" component={ InputDeadSick } />
          <Route path="/inputs/purchase" component={ InputPurchase } />
          <Route path="/inputs/borrow" component={ InputBorrowed } />
          <Route path="/inputs/eggs" component={ InputEggs } />
          <Route path="/inputs/money" component={ InputMoney } />
          <Route path="/withdraw" component={ Withdraw }/>

          <Route path="/tables/late" component={ LatePayment } />
          <Route path="/tables/annedebt" component={ AnneDebt } />
          <Route path="/tables/balances" component={ BalancesBasicTable } />
          <Route path="/tables/entries" component={ BasicTable } />

          <Route path="/icons/mdi" component={ Mdi } />

          <Route path="/charts/chart-js" component={ ChartJs } />


          <Route path="/user-pages/login-1" component={ Login } />
          <Route path="/user-pages/register-1" component={ Register1 } />

          <Route path="/error-pages/error-404" component={ Error404 } />
          <Route path="/error-pages/error-500" component={ Error500 } />
          <Route path="*" component={Error404} status={404}/>
        </Switch>
      </Suspense>
    );
}

export default AppRoutes;
