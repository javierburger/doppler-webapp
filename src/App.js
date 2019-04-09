import React, { Component } from 'react';
import './App.css';
import DopplerIntlProvider from './i18n/DopplerIntlProvider';
import { Route, Redirect, Switch, withRouter } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Reports from './components/Reports/Reports';
import { InjectAppServices } from './services/pure-di';
import Loading from './components/Loading/Loading';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import queryString from 'query-string';

class App extends Component {
  /**
   * @param { Object } props - props
   * @param { string } props.locale - locale
   * @param { import('./services/pure-di').AppServices } props.dependencies - dependencies
   */
  constructor({ locale, dependencies: { appSessionRef, sessionManager } }) {
    super();

    this.updateSession = this.updateSession.bind(this);

    this.sessionManager = sessionManager;

    this.state = {
      dopplerSession: appSessionRef.current,
      i18nLocale: locale,
    };
  }

  componentDidMount() {
    this.sessionManager.initialize(this.updateSession);
  }

  componentWillUnmount() {
    this.sessionManager.finalize();
  }

  static getDerivedStateFromProps(props, state) {
    const { lang: langFromUrl } =
      props.location && props.location.search && queryString.parse(props.location.search);

    const expectedLang = ['es', 'en'].includes(langFromUrl) ? langFromUrl : null;

    if (state.langFromUrl !== expectedLang) {
      return expectedLang
        ? {
            langFromUrl: expectedLang,
            i18nLocale: expectedLang,
          }
        : { langFromUrl: null };
    }

    // No state update necessary
    return null;
  }

  updateSession(dopplerSession) {
    const stateChanges = { dopplerSession: dopplerSession };

    if (
      !this.state.langFromUrl &&
      dopplerSession.userData &&
      dopplerSession.userData.user &&
      dopplerSession.userData.user.lang
    ) {
      stateChanges.i18nLocale = dopplerSession.userData.user.lang;
    }

    this.setState(stateChanges);
  }

  render() {
    const {
      dopplerSession: { status: sessionStatus, userData },
      i18nLocale,
    } = this.state;

    return (
      <DopplerIntlProvider locale={i18nLocale}>
        {sessionStatus === 'unknown' ? (
          <Loading page />
        ) : (
          <Switch>
            <Route path="/" exact component={() => <Redirect to={{ pathname: '/reports' }} />} />
            <PrivateRoute
              path="/reports/"
              exact
              component={Reports}
              userData={userData}
              sessionStatus={sessionStatus}
            />
            <Route path="/login/" exact component={Login} />
            <Route path="/signup/" exact component={Signup} />
            <Route path="/forgot-password/" exact component={ForgotPassword} />
            {/* TODO: Implement NotFound page in place of redirect all to reports */}
            {/* <Route component={NotFound} /> */}
            <Route component={() => <Redirect to={{ pathname: '/reports' }} />} />
          </Switch>
        )}
      </DopplerIntlProvider>
    );
  }
}

export default withRouter(InjectAppServices(App));
