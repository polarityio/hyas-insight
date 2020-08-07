module.exports = {
    /**
     * Name of the integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @required
     */
    name: 'HYAS Insight',
    /**
     * The acronym that appears in the notification window when information from this integration
     * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
     * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
     * here will be carried forward into the notification window.
     *
     * @type String
     * @required
     */
    acronym: 'HYAS',
    /**
     * Description for this integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @optional
     */
    description:
      "Searches Hyas Insight for information on hashes, ips and domains",
    entityTypes: ['IPv4', 'IPv6', 'MD5', 'domain', 'email'],
    /**
     * Provide custom component logic and template for rendering the integration details block.  If you do not
     * provide a custom template and/or component then the integration will display data as a table of key value
     * pairs.
     *
     * @type Object
     * @optional
     */
    styles: ['./styles/hyas.less'],
    block: {
      component: {
        file: './components/block.js'
      },
      template: {
        file: './templates/block.hbs'
      }
    },
    summary: {
      component: {
        file: './components/summary.js'
      },
      template: {
        file: './templates/summary.hbs'
      }
    },
    request: {
      // Provide the path to your certFile. Leave an empty string to ignore this option.
      // Relative paths are relative to the integration's root directory
      cert: '',
      // Provide the path to your private key. Leave an empty string to ignore this option.
      // Relative paths are relative to the integration's root directory
      key: '',
      // Provide the key passphrase if required.  Leave an empty string to ignore this option.
      // Relative paths are relative to the integration's root directory
      passphrase: '',
      // Provide the Certificate Authority. Leave an empty string to ignore this option.
      // Relative paths are relative to the integration's root directory
      ca: '',
      // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
      // the url parameter (by embedding the auth info in the uri)
      proxy: '',
  
      rejectUnauthorized: true
    },
    logging: {
      level: 'info' //trace, debug, info, warn, error, fatal
    },
    onDemandOnly: true,
    /**
     * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
     * as an array of option objects.
     *
     * @type Array
     * @optional
     */
    options: [
      {
        key: 'apiKey',
        name: 'API Key',
        description: 'HYAS Api Key',
        default: '',
        type: 'password',
        userCanEdit: true,
        adminOnly: false
      },
      {
        key: 'blacklist',
        name: 'Block list Domains and IPs',
        description: 'List of domains and IPs that you never want to send to Hyas',
        default: '',
        type: 'text',
        userCanEdit: false,
        adminOnly: false
      },
      {
        key: 'domainBlacklistRegex',
        name: 'Domain Block List Regex',
        description:
          'Domains that match the given regex will not be looked up (if blank, no domains will be black listed)',
        default: '',
        type: 'text',
        userCanEdit: false,
        adminOnly: false
      },
      {
        key: 'ipBlacklistRegex',
        name: 'IP Block List Regex',
        description: 'IPs that match the given regex will not be looked up (if blank, no IPs will be black listed)',
        default: '',
        type: 'text',
        userCanEdit: false,
        adminOnly: false
      }
    ]
  };
  