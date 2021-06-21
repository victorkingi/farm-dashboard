import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';
import { Trans } from 'react-i18next';

class Sidebar extends Component {

  state = {};

  toggleMenuState(menuState) {
    if (this.state[menuState]) {
      this.setState({[menuState] : false});
    } else if(Object.keys(this.state).length === 0) {
      this.setState({[menuState] : true});
    } else {
      Object.keys(this.state).forEach(i => {
        this.setState({[i]: false});
      });
      this.setState({[menuState] : true});
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      this.onRouteChanged();
    }
  }

  onRouteChanged() {
    document.querySelector('#sidebar').classList.remove('active');
    Object.keys(this.state).forEach(i => {
      this.setState({[i]: false});
    });

    const dropdownPaths = [
      {path:'/apps', state: 'appsMenuOpen'},
      {path:'/basic-ui', state: 'basicUiMenuOpen'},
      {path:'/form-elements', state: 'formElementsMenuOpen'},
      {path:'/tables', state: 'tablesMenuOpen'},
      {path:'/icons', state: 'iconsMenuOpen'},
      {path:'/charts', state: 'chartsMenuOpen'},
      {path:'/user-pages', state: 'userPagesMenuOpen'},
      {path:'/error-pages', state: 'errorPagesMenuOpen'},
    ];

    dropdownPaths.forEach((obj => {
      if (this.isPathActive(obj.path)) {
        this.setState({[obj.state] : true})
      }
    }));

  }

  render () {
    return (
        <nav className="sidebar sidebar-offcanvas" id="sidebar">
          <div className="sidebar-brand-wrapper d-none d-lg-flex align-items-center justify-content-center fixed-top">
            <a className="sidebar-brand brand-logo-mini" href="/"><img src={require('../../assets/images/logo192.png')} alt="logo" /></a>
          </div>
          <ul className="nav">
            <li className="nav-item profile">
              <div className="profile-desc">
                <div className="profile-pic">
                  <div className="count-indicator">
                    <img className="img-xs rounded-circle " src={require('../../assets/images/faces/user.png')} alt="profile" />
                    <span className="count bg-success"></span>
                  </div>
                  <div className="profile-name">
                    <h5 className="mb-0 font-weight-normal"><Trans>Victor</Trans></h5>
                  </div>
                </div>
              </div>
            </li>
            <li className="nav-item nav-category">
              <span className="nav-link"><Trans>Navigation</Trans></span>
            </li>
            <li className={ this.isPathActive('/dashboard') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <Link className="nav-link" to="/dashboard">
                <span className="menu-icon"><i className="mdi mdi-speedometer"></i></span>
                <span className="menu-title"><Trans>Dashboard</Trans></span>
              </Link>
            </li>
            <li className={ this.isPathActive('/form-elements') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.formElementsMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('formElementsMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-playlist-play"></i>
              </span>
                <span className="menu-title"><Trans>Input Pages</Trans></span>
                <i className="menu-arrow"></i>
              </div>
              <Collapse in={ this.state.formElementsMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/sale">
                        <Trans>Sales</Trans></Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/purchase">
                        <Trans>Purchases</Trans></Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/eggs">
                        <Trans>Eggs</Trans></Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/borrow">
                        <Trans>Borrowed</Trans></Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/ds">
                        <Trans>Dead / Sick</Trans></Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/money">
                        <Trans>Send</Trans></Link></li>
                  </ul>
                </div>
              </Collapse>
            </li>
            <li className={ this.isPathActive('/tables') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.tablesMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('tablesMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-table-large"></i>
              </span>
                <span className="menu-title"><Trans>Debts</Trans></span>
                <i className="menu-arrow"></i>
              </div>
              <Collapse in={ this.state.tablesMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/tables/basic-table')
                                ? 'nav-link active' : 'nav-link' }
                          to="/tables/basic-table">
                        <Trans>Late Payment</Trans></Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/tables/basic-table')
                                ? 'nav-link active' : 'nav-link' }
                          to="/tables/basic-table">
                        <Trans>Anne Debt</Trans></Link></li>
                  </ul>
                </div>
              </Collapse>
            </li>
            <li className={ this.isPathActive('/charts') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.chartsMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('chartsMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-chart-bar"></i>
              </span>
                <span className="menu-title"><Trans>Charts</Trans></span>
                <i className="menu-arrow"></i>
              </div>
              <Collapse in={ this.state.chartsMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/charts/chart-js')
                            ? 'nav-link active' : 'nav-link' }
                            to="/charts/chart-js">
                        <Trans>All Charts</Trans></Link></li>
                  </ul>
                </div>
              </Collapse>
            </li>
            <li className={ this.isPathActive('/user-pages') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.userPagesMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('userPagesMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-security"></i>
              </span>
                <span className="menu-title"><Trans>User Pages</Trans></span>
                <i className="menu-arrow"></i>
              </div>
              <Collapse in={ this.state.userPagesMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/user-pages/login-1') ? 'nav-link active' : 'nav-link' } to="/user-pages/login-1"><Trans>Login</Trans></Link></li>
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/user-pages/register-1') ? 'nav-link active' : 'nav-link' } to="/user-pages/register-1"><Trans>Sign Up</Trans></Link></li>
                  </ul>
                </div>
              </Collapse>
            </li>
          </ul>
        </nav>
    );
  }

  isPathActive(path) {
    return this.props.location.pathname.startsWith(path);
  }

  componentDidMount() {
    this.onRouteChanged();
    // add class 'hover-open' to sidebar navitem while hover in sidebar-icon-only menu
    const body = document.querySelector('body');
    document.querySelectorAll('.sidebar .nav-item').forEach((el) => {

      el.addEventListener('mouseover', function() {
        if(body.classList.contains('sidebar-icon-only')) {
          el.classList.add('hover-open');
        }
      });
      el.addEventListener('mouseout', function() {
        if(body.classList.contains('sidebar-icon-only')) {
          el.classList.remove('hover-open');
        }
      });
    });
  }

}

export default withRouter(Sidebar);
