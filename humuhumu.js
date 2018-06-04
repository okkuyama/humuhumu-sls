import AWS from 'aws-sdk'
import uuid from 'node-uuid'

AWS.config.update({region: 'ap-northeast-1'})
const dynamoDb = new AWS.DynamoDB.DocumentClient()

// テーブル名
const g_tableName = 'humuhumuTable'

// -------------------------------------------------------
// （ローカル）レスポンス整形関数
// -------------------------------------------------------
const createResponse = (statusCode, body) => (
  {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    },
    body: JSON.stringify(body),
  }
);

// -------------------------------------------------------
// ふむふむ投票
// -------------------------------------------------------
export const vote = (event, context, callback) => {
  // パラメータチェック
  const data = JSON.parse(event.body)
  if (!data.groupId) {
    // GroupIDが指定されていない場合は処理を抜ける
    callback(null, createResponse(500, { message: "groupId is not specified." }))
    return
  }

  // クエリ作成
  const timestamp = new Date().getTime();
  var params = {
    TableName: g_tableName,
    Item: {
      humuId: uuid.v1(),
      groupId: data.groupId,
      createdAt: timestamp,
    },
  }
  // DBへ追加
  dynamoDb.put(params, function(err, data) {
    if (err) {
      console.error(error);
      callback(null, createResponse(500, { message: "Couldn\'t create the todo item." }))
      return;
    }
    // create a response
    callback(null, createResponse(200, params.Item))
  });
}

// -------------------------------------------------------
// グループ内のふむふむカウント取得
// -------------------------------------------------------
module.exports.groupCount = (event, context, callback) => {

  // パラメータチェック
  if (!event.pathParameters.groupId) {
    // GroupIDが指定されていない場合は処理を抜ける
    callback(null, createResponse(500, { message: "groupId is not specified." }))
    return
  }
  var param = {
    TableName: g_tableName,
    KeyConditionExpression : "#key = :key",
    ExpressionAttributeNames  : {"#key" : "groupId"},
    ExpressionAttributeValues : {":key" : event.pathParameters.groupId}
  }

  dynamoDb.query(param, (err, data) => {
    if (err) {
      callback(null, createResponse(500, { message: err.message }))
    } else if (data.Count) {
      callback(null, createResponse(200, data.Count))
    } else {
      callback(null, createResponse(500, { message: "item not found" }))
    }
  })
}

// -------------------------------------------------------
// グループ内のふむふむカウントクリア
// ※ RDSのようなSQL指定での削除が出来ないためQuery抽出し１件づつ削除
// -------------------------------------------------------
export const deleteGroupCount = (event, context, callback) => {

  // パラメータチェック
  if (!event.pathParameters.groupId) {
    // GroupIDが指定されていない場合は処理を抜ける
    callback(null, createResponse(500, { message: "groupId is not specified." }))
    return
  }

  // クエリ作成（グループID全て取得）
  var param = {
    TableName: g_tableName,
    KeyConditionExpression : "#key = :key",
    ExpressionAttributeNames  : {"#key" : "groupId"},
    ExpressionAttributeValues : {":key" : event.pathParameters.groupId}
  }

  // 削除対象レコードを取得
  dynamoDb.query(param, function(err, data) {
    if (err) {
      console.error(error);
      callback(null, createResponse(500, { message: "delete item not found." }))
      return;
    }

    // 取得した内容を逐次削除
    data.Items.forEach(function(item){
      // 削除対象レコード抽出パラメータ
      var params = {
        TableName: g_tableName,
        Key:{
          "groupId":item.groupId,
          "humuId":item.humuId
        }
      };
      // 削除処理
      dynamoDb.delete(params, function(err, data) {
        if (err) {
          console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        }
      });
    });
    callback(null, createResponse(200, { message: "group item deleted." }))
  });
}
