'use strict';

const request = require('request');
const _ = require('lodash');
const fp = require('lodash/fp');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');
const PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

let Logger;
let requestWithDefaults;
let previousDomainRegexAsString = '';
let previousIpRegexAsString = '';
let domainBlocklistRegex = null;
let ipBlocklistRegex = null;

const MAX_DOMAIN_LABEL_LENGTH = 63;
const MAX_ENTITY_LENGTH = 100;
const MAX_PARALLEL_LOOKUPS = 10;
const PAGE_SIZE = 5;
const IGNORED_IPS = new Set(['127.0.0.1', '255.255.255.255', '0.0.0.0']);
const url = 'https://insight.hyas.com/api/ext';
const uiurl = 'https://apps.hyas.com';
/**
 *
 * @param entities
 * @param options
 * @param cb
 */
function startup(logger) {
  Logger = logger;
  let defaults = {};

  if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
    defaults.cert = fs.readFileSync(config.request.cert);
  }

  if (typeof config.request.key === 'string' && config.request.key.length > 0) {
    defaults.key = fs.readFileSync(config.request.key);
  }

  if (
    typeof config.request.passphrase === 'string' &&
    config.request.passphrase.length > 0
  ) {
    defaults.passphrase = config.request.passphrase;
  }

  if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
    defaults.ca = fs.readFileSync(config.request.ca);
  }

  if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
    defaults.proxy = config.request.proxy;
  }

  if (typeof config.request.rejectUnauthorized === 'boolean') {
    defaults.rejectUnauthorized = config.request.rejectUnauthorized;
  }

  defaults.json = true;
  requestWithDefaults = request.defaults(defaults);
}

function doLookup(entities, options, cb) {
  let lookupResults = [];
  let tasks = [];

  _setupRegexBlocklists(options);

  Logger.debug(entities);

  entities.forEach((entity) => {
    if (entity.isIPv4) {
      if (!_isInvalidEntity(entity) && !_isEntityBlocklisted(entity, options)) {
        //do the lookup
        let requestOptions = {
          json: true,
          uri: url + '/passivedns',
          method: 'POST',
          headers: {
            'X-API-Key': options.apiKey,
            'Content-Type': 'application/json'
          },
          body: {
            applied_filters: {
              ipv4: entity.value
            }
          }
        };

        Logger.trace({ options: requestOptions }, 'Request URI');

        tasks.push(function (done) {
          requestWithDefaults(requestOptions, function (error, res, body) {
            body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
            let processedResult = handleRestError(error, entity, res, body);

            if (processedResult.error) {
              done(processedResult);
              return;
            }

            done(null, {
              ...processedResult,
              link: `${uiurl}/static/details?ip=${entity.value}`
            });
          });
        });
      }
    }
    if (entity.isIPv6) {
      if (!_isInvalidEntity(entity) && !_isEntityBlocklisted(entity, options)) {
        //do the lookup
        let requestOptions = {
          json: true,
          uri: url + '/passivedns',
          method: 'POST',
          headers: {
            'X-API-Key': options.apiKey,
            'Content-Type': 'application/json'
          },
          body: {
            applied_filters: {
              ipv6: entity.value
            }
          }
        };

        Logger.trace({ options: requestOptions }, 'Request URI');

        tasks.push(function (done) {
          requestWithDefaults(requestOptions, function (error, res, body) {
            body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
            let processedResult = handleRestError(error, entity, res, body);

            if (processedResult.error) {
              done(processedResult);
              return;
            }

            done(null, {
              ...processedResult,
              link: `${uiurl}/static/details?ip=${entity.value}`
            });
          });
        });
      }
    } else if (entity.isDomain) {
      if (!_isInvalidEntity(entity) && !_isEntityBlocklisted(entity, options)) {
        //do the lookup
        let requestOptions = {
          uri: url + '/whois',
          method: 'POST',
          headers: {
            'X-API-Key': options.apiKey,
            'Content-Type': 'application/json'
          },
          body: {
            applied_filters: {
              domain: entity.value
            }
          },
          json: true
        };

        Logger.trace({ options: requestOptions }, 'Request URI');

        tasks.push(function (done) {
          requestWithDefaults(requestOptions, function (error, res, body) {
            body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
            let processedResult = handleRestError(error, entity, res, body);
            if (processedResult.error) {
              done(processedResult);
              return;
            }

            done(null, {
              ...processedResult,
              link: `${uiurl}/static/details?domain=${entity.value}`
            });
          });
        });
      }
    } else if (entity.type === 'custom') {
      if (!_isInvalidEntity(entity) && !_isEntityBlocklisted(entity, options)) {
        //do the lookup
        const phone = phoneUtil.format(
          phoneUtil.parseAndKeepRawInput(entity.value, 'US'),
          PNF.E164
        );
        let requestOptions = {
          uri: url + '/whois',
          method: 'POST',
          headers: {
            'X-API-Key': options.apiKey,
            'Content-Type': 'application/json'
          },
          body: {
            applied_filters: { phone }
          },
          json: true
        };

        Logger.trace({ options: requestOptions }, 'Request URI');

        tasks.push(function (done) {
          requestWithDefaults(requestOptions, function (error, res, body) {
            body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
            let processedResult = handleRestError(error, entity, res, body);
            if (processedResult.error) {
              done(processedResult);
              return;
            }

            done(null, {
              ...processedResult,
              link: `${uiurl}/static/details?phone=${phone}`
            });
          });
        });
      }
    } else if (entity.isEmail) {
      if (!_isInvalidEntity(entity) && !_isEntityBlocklisted(entity, options)) {
        //do the lookup
        let requestOptions = {
          uri: url + '/whois',
          method: 'POST',
          headers: {
            'X-API-Key': options.apiKey,
            'Content-Type': 'application/json'
          },
          body: {
            applied_filters: {
              email: entity.value
            }
          },
          json: true
        };

        Logger.trace({ options: requestOptions }, 'Request URI');

        tasks.push(function (done) {
          requestWithDefaults(requestOptions, function (error, res, body) {
            body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
            let processedResult = handleRestError(error, entity, res, body);
            if (processedResult.error) {
              done(processedResult);
              return;
            }

            done(null, {
              ...processedResult,
              link: `${uiurl}/static/details?email=${entity.value}`
            });
          });
        });
      }
    } else if (entity.isMD5 || entity.isSHA256) {
      //do the lookup
      let requestOptions = {
        uri: url + '/sample/information',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            hash: entity.value
          }
        },
        json: true
      };

      Logger.trace({ options: requestOptions }, 'Request URI');

      tasks.push(function (done) {
        requestWithDefaults(requestOptions, function (error, res, body) {
          let processedResult = handleRestError(error, entity, res, body);
          if (processedResult.error) {
            done(processedResult);
            return;
          }

          done(null, {
            ...processedResult,
            link: `${uiurl}/static/details?${
              entity.isMD5 ? 'md5' : entity.isSHA256 ? 'sha256' : 'q'
            }=${entity.value}`
          });
        });
      });
    }
  });

  async.parallelLimit(tasks, MAX_PARALLEL_LOOKUPS, (err, results) => {
    if (err) {
      Logger.error({ err: err }, 'Error');
      cb(err);
      return;
    }

    results.forEach((result) => {
      if (result.body === null || _isMiss(result.body) || _.isEmpty(result.body)) {
        lookupResults.push({
          entity: result.entity,
          data: null
        });
      } else {
        const resultWithFormatedPhoneNumber = getResultWithFormatedPhoneNumber(result);

        lookupResults.push({
          entity: result.entity,
          data: {
            summary: [],
            details: {
              result: resultWithFormatedPhoneNumber,
              link: result.link,
              pageSize: PAGE_SIZE
            }
          }
        });
      }
    });
    Logger.trace({ lookupResults }, 'Results');
    cb(null, lookupResults);
  });
}

const getResultWithFormatedPhoneNumber = fp.flow(
  fp.getOr([], 'body'),
  fp.map((detail) => ({
    ...detail,
    ...(detail.phone &&
      detail.phone.length && {
        phone: fp.map(
          ({ phone }) => ({
            link: `${uiurl}/static/details?phone=%2B${phone.slice(1)}`,
            number: phone
          }),
          detail.phone
        )
      })
  }))
);

function _setupRegexBlocklists(options) {
  if (
    options.domainBlocklistRegex !== previousDomainRegexAsString &&
    options.domainBlocklistRegex.length === 0
  ) {
    Logger.debug('Removing Domain Blocklist Regex Filtering');
    previousDomainRegexAsString = '';
    domainBlocklistRegex = null;
  } else {
    if (options.domainBlocklistRegex !== previousDomainRegexAsString) {
      previousDomainRegexAsString = options.domainBlocklistRegex;
      Logger.debug(
        { domainBlocklistRegex: previousDomainRegexAsString },
        'Modifying Domain Blocklist Regex'
      );
      domainBlocklistRegex = new RegExp(options.domainBlocklistRegex, 'i');
    }
  }

  if (
    options.ipBlocklistRegex !== previousIpRegexAsString &&
    options.ipBlocklistRegex.length === 0
  ) {
    Logger.debug('Removing IP Blocklist Regex Filtering');
    previousIpRegexAsString = '';
    ipBlocklistRegex = null;
  } else {
    if (options.ipBlocklistRegex !== previousIpRegexAsString) {
      previousIpRegexAsString = options.ipBlocklistRegex;
      Logger.debug(
        { ipBlocklistRegex: previousIpRegexAsString },
        'Modifying IP Blocklist Regex'
      );
      ipBlocklistRegex = new RegExp(options.ipBlocklistRegex, 'i');
    }
  }
}

function doDeviceGeoIpLookup(entity, options) {
  return function (done) {
    if (entity.isIPv4) {
      let requestOptions = {
        uri: url + '/device_geo',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            ipv4: entity.value
          }
        },
        json: true
      };

      requestWithDefaults(requestOptions, (error, response, body) => {
        body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
        let processedResult = handleRestError(error, entity, response, body);
        if (processedResult.error) return done(processedResult);
        done(null, processedResult.body);
      });
    } else {
      done(null, null);
    }
  };
}

function doDomainPassiveLookup(entity, options) {
  return function (done) {
    if (entity.isDomain) {
      let requestOptions = {
        uri: url + '/passivedns',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            domain: entity.value
          },
          paging: { order: 'desc', sort: 'datetime', page_number: 0, page_size: 10 }
        },
        json: true
      };

      requestWithDefaults(requestOptions, (error, response, body) => {
        body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
        let processedResult = handleRestError(error, entity, response, body);
        if (processedResult.error) return done(processedResult);
        done(null, processedResult.body);
      });
    } else {
      done(null, null);
    }
  };
}

function doIpSampleLookup(entity, options) {
  return function (done) {
    if (entity.isIPv4) {
      let requestOptions = {
        uri: url + '/sample',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            ipv4: entity.value
          }
        },
        json: true
      };

      requestWithDefaults(requestOptions, (error, response, body) => {
        body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
        let processedResult = handleRestError(error, entity, response, body);
        if (processedResult.error) return done(processedResult);
        done(null, processedResult.body);
      });
    } else {
      done(null, null);
    }
  };
}

function doDomainSampleLookup(entity, options) {
  return function (done) {
    if (entity.isDomain) {
      let requestOptions = {
        uri: url + '/sample',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            domain: entity.value
          }
        },
        json: true
      };

      requestWithDefaults(requestOptions, (error, response, body) => {
        body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
        let processedResult = handleRestError(error, entity, response, body);
        if (processedResult.error) return done(processedResult);
        done(null, processedResult.body);
      });
    } else {
      done(null, null);
    }
  };
}

function doDomainSSlLookup(entity, options) {
  return function (done) {
    if (entity.isDomain) {
      let requestOptions = {
        uri: url + '/ssl_certificate',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            domain: entity.value
          }
        },
        json: true
      };

      requestWithDefaults(requestOptions, (error, response, body) => {
        body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
        let processedResult = handleRestError(error, entity, response, body);
        if (processedResult.error) return done(processedResult);
        done(null, processedResult.body);
      });
    } else {
      done(null, null);
    }
  };
}

function doDynamicDNSLookup(entity, options) {
  return function (done) {
    if (entity.isIPv4) {
      let requestOptions = {
        uri: url + '/dynamicdns',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            ip: entity.value
          }
        },
        json: true
      };

      requestWithDefaults(requestOptions, (error, response, body) => {
        body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
        let processedResult = handleRestError(error, entity, response, body);
        if (processedResult.error) return done(processedResult);
        done(null, processedResult.body);
      });
    } else {
      done(null, null);
    }
  };
}
function doDeviceGeoLookup(entity, options) {
  return function (done) {
    if (entity.type === 'custom') {
      let requestOptions = {
        json: true,
        uri: url + '/device_geo',
        method: 'POST',
        headers: {
          'X-API-Key': options.apiKey,
          'Content-Type': 'application/json'
        },
        body: {
          applied_filters: {
            phone: phoneUtil.format(
              phoneUtil.parseAndKeepRawInput(entity.value, 'US'),
              PNF.E164
            )
          }
        }
      };

      Logger.trace({ options: requestOptions }, 'Request URI');

      requestWithDefaults(requestOptions, (error, response, body) => {
        body = body && _.isArray(body) && body.splice(0, PAGE_SIZE);
        let processedResult = handleRestError(error, entity, response, body);
        if (processedResult.error) return done(processedResult);

        Logger.trace({ test: 8798789789, processedResult });
        done(null, processedResult.body);
      });
    } else {
      done(null, null);
    }
  };
}

function onDetails(lookupObject, options, cb) {
  async.parallel(
    {
      domainSsl: doDomainSSlLookup(lookupObject.entity, options),
      domainPassive: doDomainPassiveLookup(lookupObject.entity, options),
      ipDynamic: doDynamicDNSLookup(lookupObject.entity, options),
      ipSample: doIpSampleLookup(lookupObject.entity, options),
      domainSample: doDomainSampleLookup(lookupObject.entity, options),
      deviceGeo: doDeviceGeoLookup(lookupObject.entity, options),
      deviceGeoIp: doDeviceGeoIpLookup(lookupObject.entity, options)
    },
    (err, results) => {
      if (err) {
        Logger.error(err, 'Error in On Details');
        return cb(err);
      }
      const {
        domainSsl,
        domainPassive,
        ipDynamic,
        ipSample,
        domainSample,
        deviceGeo,
        deviceGeoIp
      } = results;

      //store the results into the details object so we can access them in our template
      lookupObject.data.details = lookupObject.data.details || {};
      lookupObject.data.details.domainSsl = domainSsl;
      lookupObject.data.details.domainPassive = domainPassive;
      lookupObject.data.details.ipDynamic = ipDynamic;
      lookupObject.data.details.ipSample = ipSample;
      lookupObject.data.details.domainSample = domainSample;
      lookupObject.data.details.deviceGeo = deviceGeo;
      lookupObject.data.details.deviceGeoIp = deviceGeoIp;

      Logger.trace(
        { lookup: lookupObject.data },
        'Looking at the data after on details.'
      );

      cb(null, lookupObject.data);
    }
  );
}

function handleRestError(error, entity, res, body) {
  let result;

  if (error) {
    return {
      error: error,
      detail: 'HTTP Request Error'
    };
  }
  if (res.statusCode === 200) {
    // we got data!
    result = {
      entity: entity,
      body: body || null
    };
  } else if (res.statusCode === 404) {
    // no result found
    result = {
      entity: entity,
      body: null
    };
  } else if (res.statusCode === 202) {
    // no result found
    result = {
      entity: entity,
      body: null
    };
  } else {
    // unexpected status code
    result = {
      error: body,
      detail: `${body.error}: ${body.message}`
    };
  }
  return result;
}

function _isInvalidEntity(entity) {
  // Domains should not be over 100 characters long so if we get any of those we don't look them up
  if (entity.value.length > MAX_ENTITY_LENGTH) {
    return true;
  }

  // Domain labels (the parts in between the periods, must be 63 characters or less
  if (entity.isDomain) {
    const invalidLabel = entity.value.split('.').find((label) => {
      return label.length > MAX_DOMAIN_LABEL_LENGTH;
    });

    if (typeof invalidLabel !== 'undefined') {
      return true;
    }
  }

  if (entity.isIPv4 && IGNORED_IPS.has(entity.value)) {
    return true;
  }

  return false;
}

function _isEntityBlocklisted(entity, options) {
  const blocklist = options.blocklist;

  Logger.trace({ blocklist: blocklist }, 'checking to see what blocklist looks like');

  if (_.includes(blocklist, entity.value.toLowerCase())) {
    return true;
  }

  if (entity.isIP && !entity.isPrivateIP) {
    if (ipBlocklistRegex !== null) {
      if (ipBlocklistRegex.test(entity.value)) {
        Logger.debug({ ip: entity.value }, 'Blocked BlockListed IP Lookup');
        return true;
      }
    }
  }

  if (entity.isDomain) {
    if (domainBlocklistRegex !== null) {
      if (domainBlocklistRegex.test(entity.value)) {
        Logger.debug({ domain: entity.value }, 'Blocked BlockListed Domain Lookup');
        return true;
      }
    }
  }

  return false;
}

function _isMiss(body) {
  if (!body) {
    return true;
  }
}

function validateOptions(userOptions, cb) {
  let errors = [];
  if (
    typeof userOptions.apiKey.value !== 'string' ||
    (typeof userOptions.apiKey.value === 'string' &&
      userOptions.apiKey.value.length === 0)
  ) {
    errors.push({
      key: 'apiKey',
      message: 'You must provide a PassiveTotal API key'
    });
  }
  cb(null, errors);
}

module.exports = {
  doLookup: doLookup,
  onDetails: onDetails,
  startup: startup,
  validateOptions: validateOptions
};
