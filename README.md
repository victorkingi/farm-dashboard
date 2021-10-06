# poultry101

**An error might pop-up during yarn/npm build or yarn/npm start which is "Node Error: resolve-url-loader: CSS error".
To solve this, go to `node_modules/resolve-url-loader` open `index.js` and
under `var options` change `removeCR` from `false` to `true`. Finally close and re-run `yarn start`.**<br/><br/>
A data keeping offline-first, reactjs web app for farmers.<br/>
NB:- The project is called poultry 101 but can also be extended to
various farm animals or crop farming with just a few tweaks.
<br/>
It can also be used with companies dealing with other products as an admin
dashboard.
<br />
Credit given to [Corona React Admin Template](https://github.com/BootstrapDash/corona-react-free-admin-template)
by bootstrapDash for providing a base template to start on.
