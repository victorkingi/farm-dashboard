import React, {Component} from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';

class Sidebar extends Component {
  state = {};
  __name = localStorage.getItem('name') || 'User';

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
      {path:'/inputs', state: 'formElementsMenuOpen'},
      {path:'/tables', state: 'tablesMenuOpen'},
      {path:'/icons', state: 'iconsMenuOpen'},
      {path:'/charts', state: 'chartsMenuOpen'},
      {path:'/downloads', state: 'dloadMenuOpen'},
      {path:'/user-pages', state: 'userPagesMenuOpen'},
      {path:'/error-pages', state: 'errorPagesMenuOpen'},
    ];

    dropdownPaths.forEach((obj => {
      if (this.isPathActive(obj.path)) {
        this.setState({[obj.state] : true})
      }
    }));

  }
  isPathActive(path) {
    if (path === '/') return this.props.location.pathname === path && path === '/';
    else return this.props.location.pathname.startsWith(path);
  }

  render () {
    return (
        <nav className="sidebar sidebar-offcanvas" id="sidebar">
          <div className="sidebar-brand-wrapper d-none d-lg-flex align-items-center justify-content-center fixed-top">
            <a className="sidebar-brand brand-logo-mini" href="/"><img src={"https://firebasestorage.googleapis.com/v0/b/poultry101-f1fa0.appspot.com/o/logo192.png?alt=media&token=420012cd-80b9-483d-9f10-f3ee2c501988"} alt="logo" /></a>
          </div>
          <ul className="nav">
            <li className="nav-item profile">
              <div className="profile-desc">
                <div className="profile-pic">
                  <div className="count-indicator">
                    <img className="img-xs rounded-circle " src={"https://firebasestorage.googleapis.com/v0/b/poultry101-f1fa0.appspot.com/o/user.png?alt=media&token=a5508634-7688-48d4-a079-bfbff0724eb6"} alt="profile" />
                    <span className="count bg-success"/>
                  </div>
                  <div className="profile-name">
                    <h5 className="mb-0 font-weight-normal">Hi, {this.__name}</h5>
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
            <li className={ this.isPathActive('/inputs') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
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
                            this.isPathActive('/inputs/chknno') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/chknno">
                        Chicken Number</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/inputs/trays') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/trays">
                        Trays</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/inputs/sale') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/sale">
                        Sales</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/inputs/purchase') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/purchase">
                        Purchases</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/inputs/eggs') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/eggs">
                        Eggs</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/inputs/ds') ? 'nav-link active' : 'nav-link' }
                          to="/inputs/ds">
                        Dead / Sick</Link></li>
                  </ul>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/inputs/money') ? 'nav-link active' : 'nav-link' }
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
                <span className="menu-title">Other</span>
                <i className="menu-arrow"/>
              </div>
              <Collapse in={ this.state.tablesMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/tables/sum')
                                ? 'nav-link active' : 'nav-link' }
                          to="/tables/sum">
                        Summary</Link></li>
                  </ul>
                </div>
              </Collapse>
              <Collapse in={ this.state.tablesMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/tables/late')
                                ? 'nav-link active' : 'nav-link' }
                          to="/tables/late">
                        Late Payments</Link></li>
                  </ul>
                </div>
              </Collapse>
              <Collapse in={ this.state.tablesMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link
                          className={
                            this.isPathActive('/tables/entries')
                                ? 'nav-link active' : 'nav-link' }
                          to="/tables/entries">
                        All Entries</Link></li>
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
            <li className={ this.isPathActive('/downloads') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <div className={ this.state.dloadMenuOpen ? 'nav-link menu-expanded' : 'nav-link' } onClick={ () => this.toggleMenuState('dloadMenuOpen') } data-toggle="collapse">
              <span className="menu-icon">
                <i className="mdi mdi-cloud-download"/>
              </span>
                <span className="menu-title">Downloads</span>
                <i className="menu-arrow"/>
              </div>
              <Collapse in={ this.state.dloadMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/downloads/invoice')
                            ? 'nav-link active' : 'nav-link' }
                            to="/downloads/invoice">
                        Invoice</Link></li>
                  </ul>
                </div>
              </Collapse>
              <Collapse in={ this.state.dloadMenuOpen }>
                <div>
                  <ul className="nav flex-column sub-menu">
                    <li className="nav-item">
                      <Link className={
                        this.isPathActive('/downloads/report')
                            ? 'nav-link active' : 'nav-link' }
                            to="/downloads/report">
                        Monthly Report</Link></li>
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
                  </ul>
                </div>
              </Collapse>
            </li>
            <li className={ this.isPathActive('/withdraw') ? 'nav-item menu-items active' : 'nav-item menu-items' }>
              <Link className="nav-link" to="/withdraw">
                <span className="menu-icon"><i className="mdi mdi-square-inc-cash"/></span>
                <span className="menu-title">Withdraw</span>
              </Link>
            </li>
          </ul>
        </nav>
    );
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
