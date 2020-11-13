/* eslint-disable prettier/prettier */
import { readFileSync } from 'fs'
import { PubSub } from 'graphql-yoga'
import path from 'path'
import { check } from '../../../common/src/util'
import { Chapter } from '../entities/Chapter'
import { Comment } from '../entities/Comment'
import { Fandom } from '../entities/Fandom'
import { Post } from '../entities/Post'
import { Rating } from '../entities/Rating'
import { Survey } from '../entities/Survey'
import { SurveyAnswer } from '../entities/SurveyAnswer'
import { SurveyQuestion } from '../entities/SurveyQuestion'
import { User } from '../entities/User'
import { Resolvers, UserType } from './schema.types'

export const pubsub = new PubSub()

export function getSchema() {
  const schema = readFileSync(path.join(__dirname, 'schema.graphql'))
  return schema.toString()
}

interface Context {
  user: User | null
  fandom: Fandom | null
  post: Post | null
  comment: Comment | null
  request: Request
  response: Response
  pubsub: PubSub
  rating: Rating | null
}

export const graphqlRoot: Resolvers<Context> = {
  Query: {
    self: (_, args, ctx) => ctx.user,

    fandoms: () => Fandom.find(),
    fandom: async (_, { fandomId }) => (await Fandom.findOne({ where: { id: fandomId } }))!,

    posts: () => Post.find(),
    post: async (_, { postId }) => (await Post.findOne({ where: { id: postId } }))!,

    chapters: () => Chapter.find(),
    chapter: async (_, { chapterId }) => (await Chapter.findOne({ where: { id: chapterId } }))!,

    comments: () => Comment.find(),
    comment: async (_, { commentId }) => (await Comment.findOne({ where: { id: commentId } }))!,

    ratings: () => Rating.find(),
    rating: async (_, { ratingId }) => (await Rating.findOne({ where: { id: ratingId } })) || null,

    survey: async (_, { surveyId }) => (await Survey.findOne({ where: { id: surveyId } })) || null,
    surveys: () => Survey.find(),

    getFandomChapters: async (_, { fandomId }) => (await Chapter.find({ where: { fandom: (await Fandom.findOne({ where: { id: fandomId } }))! } }))!,
    getPostChapters: async (_, { postId }) => (await Chapter.find({ where: { post: (await Post.findOne({ where: { id: postId } }))! } }))!,
  },
  Mutation: {
    addFandom: async (_, { input }, ctx) => {
      const { fandomType, name, author } = input
      const fandom = new Fandom()
      fandom.fandomType = fandomType
      fandom.name = name
      fandom.chapters = []
      fandom.author = author
      await fandom.save()
      return fandom
    },

    addUser: async (_, { input }, ctx) => {
      const { email, password } = input
      const user = new User()
      user.password = password
      user.email = email
      user.name = "A User"
      user.userType = UserType.User
      await user.save()
      return user
    },

    addChapter: async (_, { input }, ctx) => {
      const { title, length, originDirectFromFandom, postOrFandomId, body } = input
      const chapter = new Chapter()
      chapter.originDirectFromFandom = originDirectFromFandom
      if(originDirectFromFandom){
        chapter.fandom = (await Fandom.findOne({ where: { id: postOrFandomId } }))!
        chapter.order = (await Chapter.find({ where: { fandom: (await Fandom.findOne({ where: { id: postOrFandomId } }))! } }))!.length + 1
      } else {
        chapter.post = (await Post.findOne({ where: { id: postOrFandomId } }))!
        chapter.order = (await Chapter.find({ where: { post: (await Post.findOne({ where: { id: postOrFandomId } }))! } }))!.length + 1
      }
      chapter.length = length
      chapter.title = title
      chapter.body = body
      await chapter.save()
      return chapter
    },

    makePost: async (_, { input }, ctx) => {
      const { origin, title, description } = input
      const post = new Post()
      post.origin = (await Chapter.findOne({where: {id: origin}}))!
      post.chapters = []
      post.title = title
      post.description = description
      post.upvote = 0
      post.rating = 0
      post.num_rating = 0
      await post.save()
      return post
    },

    makeComment: async (_, { input }, ctx) => {
      const { story, body, time } = input
      const comment = new Comment()
      comment.story=story
      comment.body = body
      comment.time = time
      comment.vote = 0
      await comment.save()
      return comment
    },

    voteComment: async (_, { input }, ctx) => {
      const { some_comment } = input
      const comment = check(await Comment.findOne({ where: { id: some_comment } }))
      //const some_user = check(await User.findOne({ where: { id: user } }))
      //some_user.votes.push(some_comment)
      comment.vote += 1
      await comment.save()
      return true
    },

    rateStory: async (_, { input }, ctx) => {
      const { some_story, rating, user} = input
      //const p= post(some_story)
      const some_post = check(await Post.findOne({ where: { id: some_story } }))
      const rate = new Rating()
      rate.story=some_story
      rate.rating=rating
      rate.user=user
      //const exist = check(await Rating.findOne({ where: { story: some_story} }))
      const exist =null
      if(exist==null){
        // eslint-disable-next-line prettier/prettier
        some_post.rating = Math.round(100*(some_post.rating * some_post.num_rating + rating) / (some_post.num_rating + 1))/100
        some_post.num_rating += 1
      }
      await some_post.save()
      return rate
    },

    answerSurvey: async (_, { input }, ctx) => {
      const { answer, questionId } = input
      const question = check(await SurveyQuestion.findOne({ where: { id: questionId }, relations: ['survey'] }))

      const surveyAnswer = new SurveyAnswer()
      surveyAnswer.question = question
      surveyAnswer.answer = answer
      await surveyAnswer.save()

      question.survey.currentQuestion?.answers.push(surveyAnswer)
      ctx.pubsub.publish('SURVEY_UPDATE_' + question.survey.id, question.survey)

      return true
    },
    nextSurveyQuestion: async (_, { surveyId }, ctx) => {
      // check(ctx.user?.userType === UserType.Admin)
      const survey = check(await Survey.findOne({ where: { id: surveyId } }))
      survey.currQuestion = survey.currQuestion == null ? 0 : survey.currQuestion + 1
      await survey.save()
      ctx.pubsub.publish('SURVEY_UPDATE_' + surveyId, survey)
      return survey
    },
  },
  Subscription: {
    surveyUpdates: {
      subscribe: (_, { surveyId }, context) => context.pubsub.asyncIterator('SURVEY_UPDATE_' + surveyId),
      resolve: (payload: any) => payload,
    },
  },
}
