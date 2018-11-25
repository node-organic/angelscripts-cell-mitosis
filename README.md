# angelscripts-cell-mitosis

Angel scripts for deploying organic cell on `vps` infrastructure. 
Designed to work with a cell within monorepo following stem skeleton 2.1.0.

## How to install

The minimal version of nodejs is: `Nodejs version 8+`

Open your terminal and run:

```bash
cd /path/to/cell
npm install angelscripts-cell-mitosis --save-dev
```

## VPS requirements

`Ubuntu` version 14.04+ or Debian version 7+ server **with ssh access**

## localhost requirements

* `ssh`
* `scp`
* `git`
* `tar`

## Usage

### angel cell mitosis :mitosisName :versionChange

Start a cell mitosis. This essentially deploys the current working cell to a remote outlined by the mitosis structure in cell's dna:

```
{
  cwd: '...',
  build: { ... },
  mitosis: {
    name: String,
    target: {
      domain: String,
      ip: String
    },
    versionChange: String, // "major", "minor", "patch", "current", "prerelease-<identifier>"
    mode: String,
    zygote: Boolean,
    mergeDNAFrom: String
  }
}
```

short way is using `$ angel cell mitosis :mitosisName` having versionChange defined in mitosis dna.

0. uses `versionChange` to set `packagejson.version` and git commits/pushes.

  Note you need to have git configured to push to default remote.
  
  * using `current` as versionChange indicates to skip version bump
  * using `prerelease-<identifier>` as versionChange indicates to bump a prerelease with provided `identifier`
  
1. packs current working cell by reading its name from `packagejson.name`

  Note that having `packagejson.scripts.build` present will flag that the cell can be build via `npm run build` and will engage mitosis using cell's build artifact expected at `/dist` folder. Otherwise packs:
  
  * `/dna`
  * `/cells/{cwd}`
  * `/cells/node_modules`
  * `/package.json`
  
2. uploads to `mitosis.target.ip` at `/home/node/deployments/cells/{cellName}-{packagejson.version}-{cellMode}/deployment.tar.gz`
3. unpacks `deployment.tar.gz` into its containing directory

  Note that having `mergeDNAFrom` present indicates a source directory location which will be copied over the unpacked `/dna` folder. This is usually used to provide server stored secrets.
  
  For cells which are not build `npm i --production` is performed for the monorepo and the deployed cell.
  
4. writes delpoymentJSON having contents:

  Located at `/home/node/deployments/enabled/{name}-{version}-{mitosis.mode}.json`
  
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
  
  Optionally for zygote mitosis writes the same deploymentJSON to `/home/node/deployments/running/{name}-{version}-{mitosis.mode}.json`

### angel cell apoptosis :mitosisName

This essentially deletes on the remote:

* `/home/node/deployments/enabled/{name}-{version}-{mitosis.mode}.json` 
* `/home/node/deployments/running/{name}-{version}-{mitosis.mode}.json` 

## Related

* [organic-nginx-configurator](https://github.com/node-organic/organic-nginx-configurator)
* [organic-systemd-configurator](https://github.com/node-organic/organic-systemd-configurator)
* [organic-flush-legacy-cells](https://github.com/node-organic/organic-flush-legacy-cells)


## Testing

You're more than welcome to contribute tests for this repo.

## Contributing

We :hearts: contribution. Please follow these simple rules: 

- Keep the `README.md` up-to-date with changes
- Have fun :fire::rocket::shipit:
