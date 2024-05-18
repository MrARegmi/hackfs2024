exports.extractMetadata = (data) => {
  const metadata = {
    recordCount: data.length,
    ipAddresses: [...new Set(data.map((record) => record.ip_address))],
    requestMethods: [...new Set(data.map((record) => record.request_method))],
    statusCodes: [...new Set(data.map((record) => record.status_code))],
    endpoints: [...new Set(data.map((record) => record.endpoint))],
    timestamps: [...new Set((record) => record.timestamp)],
  };

  return metadata;
};
