# humuhumu-sls
humuhumu voting button server side system (AWS Serverless Framework)

## Install
```
$ npm install
```

### Deploy (for AWS)
```
$ sls deploy -v
```
[note] Please install Serverless framework beforehand and set AWS connection information set state.

Since the API end point is created after the above execution,
The client application (humuhumu-client)
Please rewrite the URI of the `src/flux/action.js` file and recompile it.
