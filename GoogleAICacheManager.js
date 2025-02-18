function testMain() {
  const properties = PropertiesService.getUserProperties();
  console.log(properties.getProperty('OPENAI_API_KEY'));

}

