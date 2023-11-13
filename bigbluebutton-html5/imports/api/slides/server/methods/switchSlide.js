import Presentations from '/imports/api/presentations';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import RedisPubSub from '/imports/startup/server/redis';
import { extractCredentials } from '/imports/api/common/server/helpers';
import Logger from '/imports/startup/server/logger';

export default async function switchSlide(slideNumber, podId, presentationId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SetCurrentPagePubMsg';

  try {
    const { meetingId, requesterUserId } = extractCredentials(this.userId);

    check(meetingId, String);
    check(requesterUserId, String);
    check(slideNumber, Number);
    check(podId, String);

    const selector = {
      meetingId,
      podId,
      current: true,
    };

    const Presentation = await Presentations.findOneAsync(selector);

    if (!Presentation) {
      throw new Meteor.Error('presentation-not-found', 'You need a presentation to be able to switch slides');
    }

    const payload = {
      podId,
      presentationId,
      pageId: `${presentationId}/${slideNumber}`,
    };

    RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
  } catch (err) {
    Logger.error(`Exception while invoking method switchSlide ${err.stack}`);
  }
}
