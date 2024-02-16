import { Request, Response } from 'express';
import { AppDataSource } from '../database/connection';
import Analytics from '../entity/Analytics';
import { Data } from '../lists/Data';
import { FindOptionsSelect, FindOptionsSelectByString, FindOptionsWhere } from 'typeorm';

export default {
  async setAnalytics(request: Request, response: Response) {
    const {
      name,
      type,
      inveniraStdID,
      activityID,
      category,
      value,
    } = request.body;

    try {
      const analyticsRepository = AppDataSource.getRepository(Analytics);
      const analytic = analyticsRepository.create({
        name,
        type,
        inveniraStdID,
        activityID,
        category,
        value,
      });

      const savedAnalytic = await analyticsRepository.save(analytic);

      return response.status(201).json(savedAnalytic);
    } catch (error) {
      console.error(error);
      return response.status(500).json("Server error");
    }
  },

  async getAnalytics(request: Request, response: Response) {
    try {
      // code before refactoring
      // const analyticsRepository = AppDataSource.getRepository(Analytics);

      // const qualAnalytics = await analyticsRepository.find({
      //   where: {
      //     category: "qualitative"
      //   },
      //   select: {
      //     name: true,
      //     type: true
      //   }
      // });

      // const quantAnalytics = await analyticsRepository.find({
      //   where: {
      //     category: "quantitative"
      //   },
      //   select: {
      //     name: true,
      //     type: true
      //   }
      // });

      // final code after refactoring
      const qualAnalytics = await retrieveAnalytics({ category: "qualitative" }, { name: true, type: true });
      const quantAnalytics = await retrieveAnalytics({ category: "quantitative" }, { name: true, type: true });

      return response.status(200).json({
        qualAnalytics,
        quantAnalytics
      });
    } catch (error) {
      console.error(error);
      return response.status(500).json("Server error");
    }
  },

  async getAnalyticsActivity(request: Request, response: Response) {
    const { activityID } = request.body;
    try {

      const fetchedAnalytics = await AppDataSource.createQueryBuilder()
        .select(`analytics.inveniraStdID as "inveniraStdID"`)
        .from(Analytics, "analytics")
        .where(`analytics.activityID = ${activityID}`)
        .groupBy("analytics.inveniraStdID")
        .getRawMany();

      const data = new Data<Analytics>(fetchedAnalytics);
      const iterator = data.getIterator();
      const analytics = [];

      while (iterator.hasNext()) {
        const { inveniraStdID } = iterator.next();

        // code before refactoring
        // const analyticsRepository = AppDataSource.getRepository(Analytics);
        // const qualAnalytics = await analyticsRepository.find({
        //   where: {
        //     category: "qualitative",
        //     inveniraStdID: inveniraStdID
        //   },
        //   select: {
        //     name: true,
        //     type: true,
        //     value: true
        //   }
        // });

        // const quantAnalytics = await analyticsRepository.find({
        //   where: {
        //     category: "quantitative",
        //     inveniraStdID: inveniraStdID
        //   },
        //   select: {
        //     name: true,
        //     type: true,
        //     value: true
        //   }
        // });

        // final code after refactoring
        const qualAnalytics = await retrieveAnalytics({ inveniraStdID: inveniraStdID, category: "qualitative" }, { name: true, type: true, value: true });
        const quantAnalytics = await retrieveAnalytics({ inveniraStdID: inveniraStdID, category: "quantitative" }, { name: true, type: true, value: true });

        analytics.push(
          {
            inveniraStdID: inveniraStdID,
            ...(qualAnalytics.length > 0 && { qualAnalytics: [...qualAnalytics] }),
            ...(quantAnalytics.length > 0 && { quantAnalytics: [...quantAnalytics] })
          }
        )
      }

      return response.status(200).json(analytics);
    } catch (error) {
      console.error(error);
      return response.status(500).json("Server error");
    }
  },
};

const retrieveAnalytics = async (
  where: FindOptionsWhere<Analytics> |
    FindOptionsWhere<Analytics>[], select: FindOptionsSelect<Analytics>
): Promise<Analytics[]> => {
  try {
    const analyticsRepository = AppDataSource.getRepository(Analytics);
    const analytics = await analyticsRepository.find({
      where,
      select
    });

    return analytics;

  } catch (error) {
    console.error(error);
    throw new Error("Analytics error");
  }
}