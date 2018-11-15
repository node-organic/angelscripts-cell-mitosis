# angelscripts-cell-mitosis

Angel scripts for deploying organic cells on `vps` infrastructure.

## How to install

The minimal version of nodejs is: `Nodejs version 4+`

Open your terminal and run:

```bash
npm install angelscripts-cell-mitosis --save-dev
```

## VPS requirements

`angelscripts-cell-mitosis` requires `Ubuntu` version 14.04+ or Debian version 7+

## Usage

### angel cell mitosis :mitosisName :versionChange

Start a cell mitosis. This essentially deploys the current working cell to a remote outlined by the mitosis structure in cell's dna:

```javascript
{
  name: String,
  target: {
    domain: String,
    ip: String
  },
  versionChange: String,
  mode: String,
  zygote: Boolean,
  storeCmd: "npx angel cell mitosis ${mitosisName} store"
}
```

1. packs current working cell by reading its name from `packagejson.name`
2. uploads to mitosis' target `mitosis.target.ip` at `/home/node/deployments/cells/{name}-{version}-{mitosis.mode}.json`
3. writes to `/home/node/deployments/{name}-{version}-{mitosis.mode}.json`

  ```javascript
{
  name: packagejson.name,
  cwd: process.cwd(),
  version: packagejson.version,
  nodeVersion: packagejson.engines.node,
  endpoint: '127.0.0.1:' + port,
  port: port,
  mountpoint: 'cell-mountpoints.{cellName}',
  domain: mitosis.target.domain,
  mitosis: mitosis
}
  ```

### angel cell apoptosis :mitosisName

Deletes a mitosis from remote. This essentially deletes `/home/node/deployments/{name}-{version}-{mitosis.mode}.json` on the remote.

### angel cell restart :mitosisName

Restarts all cells by their name by given mitosisName. :warning: this restarts all cell versions.

### angel cell status :mitosisName

Lists all active cell versions by given mitosisName.

## Testing

Doesn't have a test section. Why ?

Simulation of vps is really a tough task and for us is wasting of time.

If you project requires 100% test coverage you're more than welcome to PR in this repo.

## Contributing

We :hearts: contribution. Please follow these simple rules: 

- Update the `README.md` with details of changes. This includes new environment variables, useful file locations and parameters.
- Have fun :fire::dizzy:
