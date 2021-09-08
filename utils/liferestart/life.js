import Property from './property.js';
import Event from './event.js';
import Talent from './talent.js';
import {allAge, allEvents, allTalents} from './data/dataUtils.js';

class Life {
  constructor() {
    this.#property = new Property();
    this.#event = new Event();
    this.#talent = new Talent();
  }

  #property;
  #event;
  #talent;
  #triggerTalents;

  async initial() {
    // console.log('life.js initial', property, event, talent)
    // 加载数据方式改为从本地读取JS
    var _this = this
    _this.#property.initial(allAge());
    _this.#talent.initial(allTalents());
    _this.#event.initial(allEvents());
    // console.log('life.js initial 2 p', _this.#property,'e', _this.#event, 'e',_this.#talent)
    // var age = []
    // var talents = []
    // var events = []
    // const age = await json('age');
    // const talents = await json('talents');
    // const events = await json('events');

  }

  restart(allocation) {
      this.#triggerTalents = {};
      this.#property.restart(allocation);
      this.doTalent();
      this.#property.record();
  }

  getTalentAllocationAddition(talents) {
      return this.#talent.allocationAddition(talents);
  }

  getTalentCurrentTriggerCount(talentId) {
      return this.#triggerTalents[talentId] || 0;
  }

  next() {
      const {age, event, talent} = this.#property.ageNext();

      const talentContent = this.doTalent(talent);
      const eventContent = this.doEvent(this.random(event));
      this.#property.record();

      const isEnd = this.#property.isEnd();

      const content = [talentContent, eventContent].flat();
      return { age, content, isEnd };
  }

  doTalent(talents) {
      if(talents) this.#property.change(this.#property.TYPES.TLT, talents);
      talents = this.#property.get(this.#property.TYPES.TLT)
          .filter(talentId => this.getTalentCurrentTriggerCount(talentId) < this.#talent.get(talentId).max_triggers);

      const contents = [];
      for(const talentId of talents) {
          const result = this.#talent.do(talentId, this.#property);
          if(!result) continue;
          this.#triggerTalents[talentId] = this.getTalentCurrentTriggerCount(talentId) + 1;
          const { effect, name, description, grade } = result;
          contents.push({
              type: this.#property.TYPES.TLT,
              name,
              grade,
              description,
          })
          if(!effect) continue;
          this.#property.effect(effect);
      }
      return contents;
  }

  doEvent(eventId) {
      const { effect, next, description, postEvent } = this.#event.do(eventId, this.#property);
      this.#property.change(this.#property.TYPES.EVT, eventId);
      this.#property.effect(effect);
      const content = {
          type: this.#property.TYPES.EVT,
          description,
          postEvent,
      }
      if(next) return [content, this.doEvent(next)].flat();
      return [content];
  }

  random(events) {
      events = events.filter(([eventId])=>this.#event.check(eventId, this.#property));

      let totalWeights = 0;
      for(const [, weight] of events)
          totalWeights += weight;

      let random = Math.random() * totalWeights;
      for(const [eventId, weight] of events)
          if((random-=weight)<0)
              return eventId;
      return events[events.length-1];
  }

  talentRandom() {
      return this.#talent.talentRandom(JSON.parse(localStorage.extendTalent||'null'));
  }

  talentExtend(talentId) {
      localStorage.extendTalent = JSON.stringify(talentId);
  }

  getRecord() {
      return this.#property.getRecord();
  }

  getLastRecord() {
      return this.#property.getLastRecord();
  }

  exclusive(talents, exclusive) {
      return this.#talent.exclusive(talents, exclusive);
  }
}

export default Life;

