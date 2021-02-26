# Polarity Hyas Insight Integration

The Polarity - Hyas Insight integration queries Hyas for Domains, Ips and Hashes and returns information relating to DNS, Whois, SSL information and device geolocations. 

| ![image](https://user-images.githubusercontent.com/22529325/84897397-835f2600-b073-11ea-80e1-a2d860fb0a92.png) |
|---|
|Hyas Insight Example|

## Hyas Insight Integration Options

### Hyas Insight API Key
API Key needed to utilize Hyas Insight API. 

### Domain and IP Blocklist

This is an alternate option that can be used to specify domains or IPs that you do not want sent to Hyas Insight.  The data must specify the entire IP or domain to be blocked (e.g., www.google.com is treated differently than google.com).

### Domain Blocklist Regex

This option allows you to specify a regex to blocklist domains.  Any domain matching the regex will not be looked up.  If the regex is left blank then no domains will be blocklisted.

### IP Blocklist Regex

This option allows you to specify a regex to blocklist IPv4 Addresses.  Any IPv4 matching the regex will not be looked up.  If the regex is left blank then no IPv4s will be blocklisted.


## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/