import CreatePage from './page'
import EventBus, { BUS_EVENT_NAME } from './eventBus'
import path from './path'

module.exports = {
  CreatePage,
  EventBus,
  ...path
}
