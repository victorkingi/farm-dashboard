import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';

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
            <a className="sidebar-brand brand-logo-mini" href="/"><img src={"https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/logo256.png?alt=media&token=25b09b36-23e6-4c62-9207-667d99541df4"} alt="logo" /></a>
          </div>
          <ul className="nav">
            <li className="nav-item profile">
              <div className="profile-desc">
                <div className="profile-pic">
                  <div className="count-indicator">
                    <img className="img-xs rounded-circle " src={"https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/user.png?alt=media&token=e9a7afc0-27d9-4285-8e34-7b530b141c42"} alt="profile" />
                    <span className="count bg-success"/>
                  </div>
                  <div className="profile-name">
                    <h5 className="mb-0 font-weight-normal">Victor</h5>
                  </div>
                </div>
              </div>
            </li>
            <li className="nav-item nav-category">
              <span className="nav-link">Navigation</span>
            </li>
            <li className={ this.isPathActive('/') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <Link className="nav-link" to="/">
                <span className="menu-icon"><i className="mdi mdi-speedometer"/></span>
                <span className="menu-title">Dashboard</span>
              </Link>
            </li>
            <li className={ this.isPathActive('/form-elements') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.formElementsMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('formElementsMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-playlist-play"/>
              </span>
                <span className="menu-title">Input Pages</span>
                <i className="menu-arrow"/>
              </div>
              <Collapse in={ this.state.formElementsMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/sale">
                        Sales</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/purchase">
                        Purchases</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/eggs">
                        Eggs</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/borrow">
                        Borrowed</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/ds">
                        Dead / Sick</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/form-elements/basic-elements') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/money">
                        Send</Link></li>
                  </ul>
                </div>
              </Collapse>
            </li>
            <li className={ this.isPathActive('/tables') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.tablesMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('tablesMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-table-large"/>
              </span>
                <span className="menu-title">Debts</span>
                <i className="menu-arrow"/>
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
                        Late Payment</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/tables/basic-table')
                                ? 'nav-link active' : 'nav-link' }
                          to="/tables/basic-table">
                        Anne Debt</Link></li>
                  </ul>
                </div>
              </Collapse>
            </li>
            <li className={ this.isPathActive('/charts') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.chartsMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('chartsMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-chart-bar"/>
              </span>
                <span className="menu-title">Charts</span>
                <i className="menu-arrow"/>
              </div>
              <Collapse in={ this.state.chartsMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/charts/chart-js')
                            ? 'nav-link active' : 'nav-link' }
                            to="/charts/chart-js">
                        All Charts</Link></li>
                  </ul>
                </div>
              </Collapse>
            </li>
            <li className={ this.isPathActive('/user-pages') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.userPagesMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('userPagesMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-security"/>
              </span>
                <span className="menu-title">User Pages</span>
                <i className="menu-arrow"/>
              </div>
              <Collapse in={ this.state.userPagesMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/user-pages/login-1') ? 'nav-link active' : 'nav-link' } to="/user-pages/login-1">Login</Link></li>
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/user-pages/register-1') ? 'nav-link active' : 'nav-link' } to="/user-pages/register-1">Sign Up</Link></li>
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
