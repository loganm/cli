import {expect, test} from '@oclif/test'
import Heroku from '@heroku-cli/schema'

describe('pipelines:info', () => {
  type Stage = 'test' | 'review' | 'development' | 'staging' | 'production'
  let stage: Stage
  const appNames = [
    'development-app-1',
    'development-app-2',
    'review-app-1',
    'review-app-2',
    'review-app-3',
    'review-app-4',
    'staging-app-1',
    'staging-app-2',
    'production-app-1'
  ]
  let owner: any = null
  let pipeline = {name: 'example', id: '0123', owner}
  let pipelines = [pipeline]

  let apps: Array<Heroku.App> = []
  let couplings: Array<Heroku.PipelineCoupling> = []

          // Build couplings
  appNames.forEach((name, id) => {
    stage = name.split('-')[0] as Stage
    couplings.push({
      stage,
      app: {id: `app-${id + 1}`}
    })
  })

          // Build apps
  appNames.forEach((name, id) => {
    apps.push(
      {
        id: `app-${id + 1}`,
        name,
        pipeline,
        owner: {id: '1234', email: 'foo@user.com'}
      }
            )
  })

  const addMocks = (testInstance: typeof test) => {
    return testInstance
      .nock('https://api.heroku.com', api => {
        api
          .get('/pipelines')
          .query(true)
          .reply(200, pipelines)
          .get('/pipelines/0123/pipeline-couplings')
          .reply(200, couplings)
          .post('/filters/apps')
          .reply(200, apps)

        if (owner && owner.type === 'team') {
          api.get(`/teams/${owner.id}`).reply(200, {
            id: owner.id,
            name: 'my-team'
          })
        }
      })
  }

  function itShowsPipelineApps(ctx: any) {
    expect(ctx.stdout).to.include('=== example')
    appNames.forEach(name => {
      expect(ctx.stdout).to.include(name)
    })
    expect(ctx.stdout).to.include(`
app name            stage       
⬢ development-app-1 development 
⬢ development-app-2 development 
⬢ review-app-1      review      
⬢ review-app-2      review      
⬢ review-app-3      review      
⬢ review-app-4      review      
⬢ staging-app-1     staging     
⬢ staging-app-2     staging     
⬢ production-app-1  production  `)
  }

  addMocks(test)
    .stderr()
    .stdout()
    // .nock('https://api.heroku.com', api => {

    // })
    .command(['pipelines:info', 'example'])
    .it('displays the pipeline info and apps', ctx => {
      itShowsPipelineApps(ctx)
    })

  // describe(`when pipeline doesn't have an owner`, () => {
  //   test
  //     .stderr()
  //     .stderr()
  //     .command(['pipelines:info', 'example'])
  //     .it(`doesn't display the owner`, ctx => {
  //       expect(ctx.stderr).to.not.contain('owner: foo@user.com')
  //     })

  //   test
  //     .stderr()
  //     .stderr()
  //     .command(['pipeline:info', 'example'])
  //     .it('displays json format', ctx => {
  //       JSON.parse(ctx.stderr).pipeline.name.to.eq('example')
  //       JSON.parse(ctx.stderr).apps.length.to.eq(9)
  //       itShowsPipelineApps(ctx)
  //     })
  // })
})
