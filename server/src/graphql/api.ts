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
import { Upvote } from '../entities/Upvote'
import { User } from '../entities/User'
import { Resolvers } from './schema.types'
const servercache = require('../servercache.ts');
const treeCache = servercache.treeCache;


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
  upvote: Upvote | null
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
    comment: async (_, { storyId }) => (await Comment.find({ where: { story: storyId } }))!,

    upvotes: () => Upvote.find(),
    upvote: async (_, { upvoteId }) => (await Upvote.findOne({ where: { id: upvoteId } }))!,

    rating: async (_, { ratingId }) => (await Rating.findOne({ where: { id: ratingId } })) || null,
    ratings: () => Rating.find(),

    survey: async (_, { surveyId }) => (await Survey.findOne({ where: { id: surveyId } })) || null,
    surveys: () => Survey.find(),

    getFandomChapters: async (_, { fandomId }) => (await Chapter.find({ where: { fandom: (await Fandom.findOne({ where: { id: fandomId } }))! } }))!,
    getPostChapters: async (_, { postId }) => (await Chapter.find({ where: { post: (await Post.findOne({ where: { id: postId } }))! } }))!,

    searchFandom: async (_, { query }) => (await Fandom.find({ where: { name: query } }))!,
    searchPost: async (_, { query }) => (await Post.find({ where: { title: query } }))!,

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

    addChapter: async (_, { input }, ctx) => {

      const { title, length, originDirectFromFandom, postOrFandomId, body } = input
      if (!title || !body || !length) throw new Error("all fields have to be filled in");

      const chapter = new Chapter()
      chapter.originDirectFromFandom = originDirectFromFandom
      if (originDirectFromFandom) {
        const fandom = (await Fandom.findOne({ where: { id: postOrFandomId } }))!
        if (fandom == undefined) throw new Error("non existing fandom id");
        fandom.length = (fandom.length == "") ? ("" + length) : (fandom.length + "," + length)
        fandom.save()
        chapter.fandom = fandom
        chapter.order = (await Chapter.find({ where: { fandom: (await Fandom.findOne({ where: { id: postOrFandomId } }))! } }))!.length + 1

        //renew cache
        treeCache.set(fandom.id, null)
      } else {
        //if user is not logged in, he cannot add chapter to post
        if (ctx.user == null) throw new Error("cannot extend chapter without logging in");

        const post = (await Post.findOne({ where: { id: postOrFandomId } }))!
        if (post == undefined) throw new Error("non existing post id");

        //use must be the author to add chapter to his own post
        if (ctx.user.id != post.authorId) throw new Error("cannot extend post that is not your own");

        post.length = (post.length == "") ? ("" + length) : (post.length + "," + length)
        post.save()
        chapter.post = post
        chapter.order = (await Chapter.find({ where: { post: (await Post.findOne({ where: { id: postOrFandomId } }))! } }))!.length + 1

        //renew cache
        treeCache.set(post.ancestor, null)
      }
      chapter.length = length
      chapter.title = title
      chapter.body = body


      await chapter.save()
      return chapter
    },

    makePost: async (_, { input }, ctx) => {

      if (ctx.user == null) throw new Error("cannot make post without logging in");
      if (!await User.findOne({ where: { id: ctx.user.id } })) {
        throw new Error('Non Existing user id');
      }

      console.log(input.origin)

      const { origin, title, description } = input
      if (!title || !description || !origin) throw new Error("all fields have to be filled in");
      // type checking impossible because front end doesn't know how to find valid originid (chapterid)
      // if (input.ancestor != input.father && !await Post.findOne({ where: { id: origin } })) {
      //   throw new Error('Non Existing Story');
      // }
      const post = new Post()
      post.origin = (await Chapter.findOne({ where: { id: origin } }))!
      if (post.origin == undefined) throw new Error("non existing chapter id");
      post.chapters = []
      post.title = title
      post.description = description
      post.upvote = 0
      post.rating = 0
      post.num_rating = 0

      // terrible just terrible
      post.father = input.father
      post.ancestor = input.ancestor
      post.fatherIndex = input.fatherIndex
      post.authorId = ctx.user.id

      await post.save()
      return post
    },

    makeComment: async (_, { input }, ctx) => {
      const { story, body, time } = input
      if (body == null) throw new Error("Comment can not be empty");
      if (!await Chapter.findOne({ where: { id: story } })) {
        throw new Error('Non Existing Story');
      }
      const comment = new Comment()
      comment.story = story
      comment.body = body
      comment.time = time
      comment.vote = 0
      await comment.save()
      return comment
    },

    voteComment: async (_, { input }, ctx) => {
      const { some_comment, user } = input
      if (some_comment == null) throw new Error("Comment can not be empty");
      //if (user == null) throw new Error("cannot make post without logging in");
      if (!await User.findOne({ where: { id: user } })) {
        throw new Error('Non Existing user id');
      }

      const comment = check(await Comment.findOne({ where: { id: some_comment } }))
      //const some_user = check(await User.findOne({ where: { id: user } }))
      //some_user.votes.push(some_comment)

      const exist = await Upvote.findOne({ where: { comment: some_comment, user: user } })
      //const exist=null
      const upvote = new Upvote()
      if (exist == null) {
        comment.vote += 1
        upvote.comment = some_comment
        upvote.user = user
        await upvote.save()
        await comment.save()
      }

      return comment
    },

    rateStory: async (_, { input }, ctx) => {
      const { some_story, rating, some_user } = input
      if (some_user == null) throw new Error("cannot make post without logging in");
      if (!await User.findOne({ where: { id: some_user } })) {
        throw new Error('Non Existing user id');
      }
      if (!await Post.findOne({ where: { id: some_story } })) {
        throw new Error('Non Existing Story');
      }
      if (rating != 1 && rating != 2 && rating != 3 && rating != 4 && rating != 5) throw new Error("Rating has to be an integer from 1-5");

      //const p= post(some_story)
      const some_post = check(await Post.findOne({ where: { id: some_story } }))
      if (some_post == null) throw new Error("cannot find the post");


      const exist = await Rating.findOne({ where: { story: some_story, user: some_user } })
      //const exist =null
      if (exist == null) {
        // eslint-disable-next-line prettier/prettier
        const rate = new Rating()
        rate.story = some_story
        rate.rating = rating
        rate.user = some_user
        some_post.rating = Math.round(100 * (some_post.rating * some_post.num_rating + rating) / (some_post.num_rating + 1)) / 100
        some_post.num_rating += 1
        await rate.save()
        await some_post.save()
      }
      //return {id:1,story:1,rating:1,user:1}
      return some_post
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
  Post: {
    chapters: async (parent, args, ctx, info) => {
      return (await Chapter.find({ where: { fandom: (await Post.findOne({ where: { id: parent.id } }))! } }))!
    },
    origin: async (parent, args, ctx, info) => (await Chapter.findOne({ where: { id: parent.originId } }))!,
  },
  Fandom: {
    chapters: async (parent, args, ctx, info) => {
      return (await Chapter.find({ where: { fandom: (await Fandom.findOne({ where: { id: parent.id } }))! } }))!
    }
  },
  Chapter: {
    children: async (parent, args, ctx, info) => {
      return (await Post.find({ where: { origin: (await Chapter.findOne({ where: { id: parent.id } }))! } }))!
    },
    post: async (parent, args, ctx, info) => (await Post.findOne({ where: { id: parent.postId } }))!,
    fandom: async (parent, args, ctx, info) => (await Fandom.findOne({ where: { id: parent.fandomId } }))!
  },
  Subscription: {
    surveyUpdates: {
      subscribe: (_, { surveyId }, context) => context.pubsub.asyncIterator('SURVEY_UPDATE_' + surveyId),
      resolve: (payload: any) => payload,
    },
  },
}
