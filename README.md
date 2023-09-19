# kindle_sale_watcher

kindle_sale_watcher is a bot that posts kindle sale items on slack.

## usage

### create google apps script project

1. access to google drive
1. create spread sheet
1. open google apps script
    * Extensions > Apps Script
1. copy script id
    * Project Settings > IDs > Script ID

### push source code to google apps script project

1. `git clone ...`
1. `docker-compose build`
1. `docker-compose up -d`
1. `cp -p .clasp.json.example .clasp.json`
1. `vim .clasp.json`
1. `docker-compose exec clasp npx clasp login --no-localhost`
    * if can't login
      1. `docker-compose exec clasp apk add curl`
      1. `docker-compose exec clasp npx clasp login`
      1. `docker-compose exec clasp curl localhost:XXXXX` from another terminal after view `This site cannot be accessed` page
1. `docker-compose exec clasp npx clasp push`

### create incomingwebhooks on slack

1. access to https://slack.com/apps/A0F7XDUAZ-incoming-webhooks
1. create incoming webhooks from `Add to Slack` button
1. copy webhook url

### setting google apps script

1. open google apps script
1. set slack webhook url
    * Project Settings > Script Properties > Add script property

      |Name    |Value               |
      |--------|--------------------|
      |Property|"SLACK_INCOMING_URL"|
      |Value   |your webhook url    |
1. set trigger
    * Triggers > Add Trigger

      |function        |deployment|event source|type       |day|time|failure notification|
      |----------------|----------|------------|-----------|---|----|--------------------|
      |watchDaily      |Head      |Time-driven |Day timer  |-  |Any |Any                 |
      |watchMonthly    |Head      |Time-driven |Month timer|1st|Any |Any                 |
      |postMonthlyItems|Head      |Time-driven |Day timer  |-  |Any |Any                 |

### test run and authorization

1. open google apps script
1. run watchDaily
    * Editor > select `watchDaily` from `Select function to run` > Run

