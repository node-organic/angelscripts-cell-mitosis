# angelscripts-cell-mitosis

Angel scripts for deploying organic cells on `vps` infrastructure. Plays nicely with:

* [organic-nginx-configurator](https://github.com/node-organic/organic-nginx-configurator)
* [organic-systemd-configurator](https://github.com/node-organic/organic-systemd-configurator)
* [organic-flush-legacy-cells](https://github.com/node-organic/organic-flush-legacy-cells)

## How to install

The minimal version of nodejs is: `Nodejs version 4+`

Open your terminal and run:

```bash
npm install angelscripts-cell-mitosis --save-dev
```

## VPS requirements

`Ubuntu` version 14.04+ or Debian version 7+ server **with ssh access**

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
  versionChange: String, // "major", "minor", "patch", "current", "prerelease-<identifier>"
  mode: String,
  zygote: Boolean,
  storeCmd: "npx angel cell mitosis ${mitosisName} store"
}
```

short way is using `$ angel cell mitosis :mitosisName` having versionChange defined in mitosis dna.

0. uses `versionChange` to set `packagejson.version` and git commits/pushes.

  Note you need to have git configured to push to default remote.
  
  * using `current` as versionChange indicates to skip version bump
  * using `prerelease-<identifier>` as versionChange indicates to bump a prerelease with provided `identifier`
  
1. packs current working cell by reading its name from `packagejson.name`
2. uploads to mitosis' target `mitosis.target.ip` at `/home/node/deployments/cells/{name}-{version}-{mitosis.mode}.json`
3. writes to `/home/node/deployments/{name}-{version}-{mitosis.mode}.json` having contents:

  ```javascript
{
  name: packagejson.name,
  cwd: process.cwd(),
  version: packagejson.version,
  nodeVersion: packagejson.engines.node,
  endpoint: String, // computed based on mitosisDNA
  port: '@cell-ports.{cellName}',
  mountpoint: '@cell-mountpoints.{cellName}',
  mitosis: MitosisDNA
  domain: MitosisDNA.target.domain
}
  ```

### angel cell apoptosis :mitosisName

Deletes a mitosis from remote. This essentially deletes `/home/node/deployments/{name}-{version}-{mitosis.mode}.json` on the remote.

### angel cell restart :mitosisName

Restarts all cells by their name by given mitosisName. :warning: this restarts all cell versions.

### angel cell status :mitosisName

Lists all active cell versions by given mitosisName.

## Testing

You're more than welcome to PR in this repo.

## Contributing

We :hearts: contribution. Please follow these simple rules: 

- Keep the `README.md` up-to-date with changes
- Have fun :fire::rocket::shipit:
