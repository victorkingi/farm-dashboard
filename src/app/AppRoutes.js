import React, {Suspense, lazy} from 'react';
import { Switch, Route } from 'react-router-dom';

import Spinner from '../app/shared/Spinner';

const Dashboard = lazy(() => import('./dashboard/Dashboard'));

const Buttons = lazy(() => import('./basic-ui/Buttons'));
const Dropdowns = lazy(() => import('./basic-ui/Dropdowns'));
const Typography = lazy(() => import('./basic-ui/Typography'));

const InputSell = lazy(() => import('./form-elements/InputSell'));
const InputPurchase = lazy(() => import('./form-elements/InputPurchase'));
const InputMoney = lazy(() => import('./form-elements/InputMoney'));
const InputDeadSick = lazy(() => import('./form-elements/InputDeadSick'));
const InputBorrowed = lazy(() => import('./form-elements/InputBorrowed'));
const InputEggs = lazy(() => import('./form-elements/InputEggs'));

const BasicTable = lazy(() => import('./tables/BasicTable'));

const Mdi = lazy(() => import('./icons/Mdi'));

const ChartJs = lazy(() => import('./charts/ChartJs'));

const Error404 = lazy(() => import('./error-pages/Error404'));
const Error500 = lazy(() => import('./error-pages/Error500'));

const Login = lazy(() => import('./user-pages/Login'));
const Register1 = lazy(() => import('./user-pages/Register'));

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

          <Route path="/tables/basic-table" component={ BasicTable } />

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
