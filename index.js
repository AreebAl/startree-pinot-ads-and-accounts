const axios = require('axios');



module.exports.ads = async () => {
  const query = `
      SELECT 
          network,
          SUM(total_ads) AS total_ads,
          SUM(activeads) AS active_ads,
          SUM(disabled_ads_count) AS disabled_ads,
          ROUND((SUM(disabled_ads_count) / SUM(total_ads)) * 100, 2) AS ratio,
          business_center_name,
          SUM(total_ads) AS total,
          SUM(activeads) AS active,
          SUM(disabled_ads_count) AS disabled,
          ROUND((SUM(disabled_ads_count) / SUM(total_ads)) * 100, 2) AS percentage,
           ad_name,
          facebookaccountid,
          created_time,
          fa_name
      FROM FacebookAds
      GROUP BY business_center_name,network,
       ad_name,
        facebookaccountid,
        created_time,
        fa_name
      `;

  try {
    const response = await axios.post(
      process.env.STARTREEAPIURL,
      { sql: query },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.STARTREE_API_KEY}`,
          database: "ws_2qqfdnmy1xas"
        }
      }
    );

    const data = response.data.resultTable.rows.map(row => ({
      business_manager: row[5],
      network: row[0],
      total: row[6],
      active: row[7],
      disabled: row[8],
      percentage: `${row[9]}%`,
      ad_name: row[10],
      account_id: row[11],
      created_time: convertEpochToDate(row[12]),
      fa_name: row[13]
      
    }));

    const summary = {
      total_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[1], 0),
      active_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[2], 0),
      disabled_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[3], 0),
      // ratio: `${response.data.resultTable.rows.reduce((sum, row) => sum + row[4], 0)}%`

    };

    return {
      statusCode: 200,
      body: JSON.stringify({ summary, data }),
    };
  } catch (error) {
    console.error('Error querying StarTree Pinot:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from StarTree Pinot' }),
    };
  }
};





module.exports.accounts = async () => {
  const query = `
      SELECT 
          businesscentername AS business_manager,
          COUNT(*) AS total,
          name,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS disabled,
          SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS unsettled,
          SUM(CASE WHEN status NOT IN (1, 2, 3) THEN 1 ELSE 0 END) AS closed,
          ROUND(
              (SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
              2
          ) AS percentage,
          facebookaccountid AS account_id,
          deisablereason AS reason
      FROM Fa_AdsAccount
      GROUP BY businesscentername, facebookaccountid, deisablereason, name
  `;

  try {
    const response = await axios.post(
      process.env.STARTREEAPIURL,
      { sql: query },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.STARTREE_API_KEY}`,
          database: "ws_2qqfdnmy1xas"
        }
      }
    );

    const data = response.data.resultTable.rows.map(row => ({
      business_manager: row[0],
      total: row[1],
      name: row[2],
      active: row[3],
      disabled: row[4],
      unsettled: row[5],
      closed: row[6],
      percentage: `${row[7]}%`,
      account_id: row[8],
      reason: row[9]
    }));

    const summary = {
      total_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[1], 0),
      active_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[3], 0),
      disabled_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[4], 0),
      unsettled_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[5], 0),
      closed_ads: response.data.resultTable.rows.reduce((sum, row) => sum + row[6], 0),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ summary, data }),
    };
  } catch (error) {
    console.error('Error querying StarTree Pinot:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from StarTree Pinot' }),
    };
  }
};


const convertEpochToDate = (epochTime) => {
  const date = new Date(
      epochTime.toString().length === 10 
          ? epochTime * 1000 
          : epochTime 
  );

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};
