// Exam-style tables for the case studies: more columns of mixed types, extra columns the question does not need,
// a second table to join where it fits, and extra parts that need multi-step Table code even when the topic is inference.
function patchCase(id, o) {
  const c = CASES.find(x => x.id === id);
  delete c.table;
  c.tables = o.tables; c.cols = o.cols;
  if (o.code) c.code = o.code;
  if (o.t) c.t = [...new Set([...c.t, ...o.t])];
  for (const [l, edit] of Object.entries(o.edit || {})) Object.assign(c.parts.find(p => p.l === l), edit);
  (o.parts || []).forEach(p => c.parts.push(p));
}

patchCase('cs-bike', {t:['groups'],
 tables:[
  {name:'rides', cols:['ride_id','station','end_station','member','minutes','day','temp_f'], rows:[['10241','Sather Gate','Downtown BART','True','12.4','Mon','61'],['10242','Downtown BART','Northside','False','31.0','Mon','61'],['10243','Sather Gate','Clark Kerr','True','6.8','Tue','58'],['10244','Northside','Sather Gate','True','9.5','Wed','64'],['10245','Downtown BART','Downtown BART','True','15.2','Fri','70'],['10246','Clark Kerr','Sather Gate','False','22.7','Sat','73']], more:8213},
  {name:'stations', cols:['station','neighborhood','docks','elevation_ft'], rows:[['Sather Gate','Campus','24','220'],['Downtown BART','Downtown','30','180'],['Northside','Northside','18','330'],['Clark Kerr','Southside','20','390']], more:8}],
 cols:['rides.ride_id (int): unique ride number','rides.station (str): station where the ride started','rides.end_station (str): station where the ride ended','rides.member (bool): True if the rider has an annual membership','rides.minutes (float): length of the ride in minutes','rides.day (str): abbreviated day of the week','rides.temp_f (int): temperature in °F when the ride started','stations.station (str): station name (each station appears once)','stations.neighborhood (str): neighborhood of the station','stations.docks (int): number of bike docks','stations.elevation_ft (int): elevation of the station in feet'],
 parts:[
 {l:'h', pts:4, k:'code', t:['groups','tables'], q:'Create a table with one row per neighborhood and the average length (in minutes) of rides that STARTED in that neighborhood.', code:"rides.join([A]).select([B]).group([C])",
  blanks:[{l:'A', acc:["'station',stations","'station',stations,'station'"]},{l:'B', acc:["'neighborhood','minutes'"]},{l:'C', acc:["'neighborhood',np.mean","'neighborhood',np.average"]}],
  e:"join 用 rides 的 station（起点站）去匹配 stations 的 station，把街区 neighborhood 带进来；end_station 是终点，这里用不上。然后只留 neighborhood 和 minutes，再按街区求平均。"},
 ]});

patchCase('cs-dining', {t:['tables'],
 tables:[{name:'waste', cols:['date','hall','meal','served','leftover_kg','theme','veg_only'], rows:[['2026-09-08','Crossroads','Lunch','812','41.6','Taco Bar','False'],['2026-09-08','Cafe 3','Dinner','455','30.1','Pasta','False'],['2026-09-09','Clark Kerr','Breakfast','230','6.9','Classic','False'],['2026-09-09','Foothill','Dinner','390','22.4','Curry','True'],['2026-09-10','Crossroads','Dinner','760','35.0','Stir Fry','False'],['2026-09-10','Cafe 3','Lunch','498','18.2','Salad Bar','True']], more:1089}],
 cols:['date (str): date of the meal service, "YYYY-MM-DD"','hall (str): the dining hall','meal (str): Breakfast, Lunch, or Dinner','served (int): number of plates served','leftover_kg (float): total kilograms of food left on trays','theme (str): the menu theme that day','veg_only (bool): True if the whole menu was vegetarian'],
 edit:{a:{e:'表里显示了 6 行，还有 1,089 行被省略，共 1,095 行。'}},
 parts:[
 {l:'h', pts:3, k:'code', t:['tables','groups'], q:'Write an expression for a table with one row per dining hall and the NUMBER of dinner services at that hall where more than 30 kg of food was left over.', code:"waste.where([A]).where([B]).group([C])",
  blanks:[{l:'A', acc:["'meal','Dinner'","'meal',are.equal_to('Dinner')"]},{l:'B', acc:["'leftover_kg',are.above(30)"]},{l:'C', acc:["'hall'"]}],
  e:"先筛出晚餐、再筛出剩菜超过 30 kg 的行（两个 where 顺序可换），最后 group('hall') 数个数。注意：一次都没超过 30 kg 的食堂不会出现在结果里，而不是显示 0。"},
 ]});

patchCase('cs-lottery', {t:['tables'],
 tables:[{name:'entrants', cols:['id','name','year','major','housing','first_concert'], rows:[['0','Maya','Junior','Data Science','Apartment','False'],['1','Leo','Junior','Economics','Apartment','True'],['2','Ana','Senior','Biology','Co-op','False'],['3','Kai','Sophomore','EECS','Dorm','True'],['4','Rhea','Senior','History','Apartment','False'],['5','Omar','Freshman','Undeclared','Dorm','True']], more:2394}],
 cols:['id (int): entry number from 0 to 2399 (Maya and her friends are ids 0–3)','name (str): entrant name','year (str): class year','major (str): intended or declared major','housing (str): Dorm, Apartment, or Co-op','first_concert (bool): True if this would be their first campus concert'],
 edit:{d:{q:'entrants is the table shown above; its id column contains np.arange(2400). Complete the code to simulate ONE lottery and count how many of the four friends (ids 0–3) win.'}},
 parts:[
 {l:'h', pts:3, k:'code', t:['tables','sampling'], q:'winners = entrants.sample(600, with_replacement=False). Write an expression for the PROPORTION of these winners who are seniors.', code:'prop = [A]',
  blanks:[{l:'A', acc:["np.mean(winners.column('year')=='Senior')","np.average(winners.column('year')=='Senior')","winners.where('year','Senior').num_rows/600","winners.where('year','Senior').num_rows/winners.num_rows","winners.where('year',are.equal_to('Senior')).num_rows/600","np.count_nonzero(winners.column('year')=='Senior')/600"]}],
  e:"把 year 列和 'Senior' 比较得到布尔数组，平均值就是比例；也可以先 where 再数行数除以 600。在零假设下反复模拟这个比例，就能得到 (f) 小题需要的分布。"},
 ]});

patchCase('cs-library', {t:['tables','groups'],
 tables:[{name:'late', cols:['return_id','category','branch','days_late','fine'], rows:[['5501','Books','Main','3','1.50'],['5502','Laptops','Moffitt','1','10.00'],['5503','Room keys','Moffitt','2','5.00'],['5504','Books','Engineering','12','6.00'],['5505','Chargers','Main','1','2.00'],['5506','Books','Main','5','2.50']], more:394}],
 cols:['return_id (int): ID of the late return','category (str): Books, Chargers, Laptops, or Room keys','branch (str): library branch','days_late (int): number of days late','fine (float): fine charged in dollars'],
 code:"model = make_array(0.55, 0.15, 0.10, 0.20)   # Books, Chargers, Laptops, Room keys\nobserved = late.group('category').column('count') / late.num_rows",
 parts:[
 {l:'h', pts:2, k:'mc', t:['groups'], q:'In the code above, model lists the proportions in the order Books, Chargers, Laptops, Room keys, not in the order the library stated them. Why?', c:['group sorts the categories alphabetically, so observed is in alphabetical order and model must match it element by element.','TVD requires the proportions to be sorted from largest to smallest.','make_array sorts its arguments automatically.','The order does not matter for any array computation.'], a:0,
  e:'group 的结果按类别名字母排序（Books, Chargers, Laptops, Room keys），observed 也就是这个顺序。数组运算是逐元素对应的，model 必须用同样的顺序，否则 |observed − model| 会把不同类别相减。'},
 {l:'i', pts:3, k:'code', t:['tables'], q:'Write an expression for the average fine among late LAPTOP returns at the Moffitt branch.', code:"avg = np.mean(late.where([A]).where([B]).column([C]))",
  blanks:[{l:'A', acc:["'category','Laptops'","'category',are.equal_to('Laptops')"]},{l:'B', acc:["'branch','Moffitt'","'branch',are.equal_to('Moffitt')"]},{l:'C', acc:["'fine'"]}],
  e:'两次 where 分别筛类别和分馆，再取 fine 列求平均。'},
 ]});

patchCase('cs-sleep', {t:['tables','groups'],
 tables:[{name:'sleep', cols:['id','group','year','caffeine','baseline_min','after_min','change'], rows:[['1','App','Junior','True','372.0','406.0','34.0'],['2','Control','Senior','False','401.0','395.5','-5.5'],['3','App','Sophomore','False','388.0','400.0','12.0'],['4','Control','Junior','True','350.0','370.5','20.5'],['5','Control','Freshman','False','415.0','423.0','8.0'],['6','App','Senior','True','342.0','381.0','39.0']], more:294}],
 cols:['id (int): volunteer ID',"group (str): 'App' or 'Control'",'year (str): class year','caffeine (bool): True if the volunteer usually has caffeine after 6 pm','baseline_min (float): average nightly sleep before the study, in minutes','after_min (float): average nightly sleep in week 4, in minutes','change (float): after_min − baseline_min'],
 parts:[
 {l:'h', pts:3, k:'code', t:['tables'], q:'Suppose the table did not have the change column. Fill in the blank to create it from the other columns.', code:"sleep = sleep.with_column('change', [A])",
  blanks:[{l:'A', acc:["sleep.column('after_min')-sleep.column('baseline_min')"]}], e:'两列数组逐元素相减，结果长度等于行数，可以直接作为新列。方向是 after − baseline，正数表示睡得更多了。'},
 {l:'i', pts:3, k:'code', t:['groups','abtest'], q:'Compute the OBSERVED test statistic (mean change for App minus mean change for Control) directly from the table.', code:"means = sleep.select([A]).group([B]).column('change mean')\nobs = means.item(0) - means.item(1)",
  blanks:[{l:'A', acc:["'group','change'"]},{l:'B', acc:["'group',np.mean","'group',np.average"]}],
  e:"只留 group 和 change 两列（否则 year 等字符串列没法求平均），按 group 求平均。结果按字母排序，App 在前，所以 item(0) − item(1) = App − Control = 8.5。"},
 ]});

patchCase('cs-rent', {t:['tables'],
 tables:[{name:'rents', cols:['Rent','Bedrooms','Roommates','Miles','Area','Furnished'], rows:[['1325','1','1','0.8','Southside','False'],['1890','2','1','0.4','Northside','True'],['1100','3','3','1.6','Elmwood','False'],['2450','1','0','0.3','Downtown','True'],['1475','2','2','1.1','Southside','False'],['980','4','4','2.3','Oakland','False']], more:494}],
 cols:['Rent (int): total monthly rent for the unit, in dollars','Bedrooms (int): number of bedrooms','Roommates (int): number of roommates sharing the rent (not counting the student)','Miles (float): distance from campus in miles','Area (str): neighborhood','Furnished (bool): True if the unit is furnished'],
 parts:[
 {l:'h', pts:3, k:'code', t:['tables'], q:"The rent is split evenly among the student and their roommates. Add a column 'Per person' with each student's share.", code:"rents = rents.with_column('Per person', [A])",
  blanks:[{l:'A', acc:["rents.column('Rent')/(rents.column('Roommates')+1)"]}], e:'人数 = 室友数 + 学生本人，所以除以 Roommates + 1。别忘了括号。'},
 {l:'i', pts:3, k:'code', t:['bootstrap','tables'], q:"Complete the code for ONE bootstrap statistic: the median 'Per person' rent among students in the resample who live less than 1 mile from campus.", code:"resample = rents.sample()\nstat = np.median(resample.where([A]).column([B]))",
  blanks:[{l:'A', acc:["'Miles',are.below(1)"]},{l:'B', acc:["'Per person'"]}], e:'先对整张表有放回重抽，再在重抽样本里筛出 1 英里以内的学生、取每人房租的中位数。重复很多次就得到这个子群体中位数的 bootstrap 分布。'},
 ]});

patchCase('cs-boba', {t:['tables','groups','causality'],
 tables:[{name:'orders', cols:['order_id','drink','size','toppings','wait_min','hour','mobile'], rows:[['7001','Brown Sugar Milk Tea','L','2','11.5','13','True'],['7002','Jasmine Green Tea','M','0','4.0','13','False'],['7003','Taro Slush','L','1','9.0','15','True'],['7004','Thai Tea','M','1','6.5','16','False'],['7005','Matcha Latte','L','3','18.0','18','True'],['7006','Lychee Black Tea','M','0','5.0','20','False']], more:1994}],
 cols:['order_id (int): order number','drink (str): drink name','size (str): M or L','toppings (int): number of toppings','wait_min (float): wait time in minutes','hour (int): hour the order was placed (0–23)','mobile (bool): True if the order was placed in the phone app'],
 parts:[
 {l:'h', pts:3, k:'code', t:['tables','center'], q:'Write an expression for the proportion of all orders that waited MORE than 14 minutes.', code:'prop = [A]',
  blanks:[{l:'A', acc:["np.mean(orders.column('wait_min')>14)","np.average(orders.column('wait_min')>14)","orders.where('wait_min',are.above(14)).num_rows/orders.num_rows","orders.where('wait_min',are.above(14)).num_rows/2000","np.count_nonzero(orders.column('wait_min')>14)/2000","np.count_nonzero(orders.column('wait_min')>14)/orders.num_rows"]}],
  e:'布尔数组求平均就是比例。由 (b) 小题的 Chebyshev，在 2–14 分钟以外的订单最多 25%，所以这个比例一定不超过 25%。'},
 {l:'i', pts:3, k:'mc', t:['groups','causality'], q:"orders.select('mobile', 'wait_min').group('mobile', np.mean) shows 6.9 for False and 9.6 for True. Which conclusion is justified?", c:['Mobile orders waited longer on average in this data, but that does not show ordering by phone causes longer waits (mobile orders might have more toppings or come at busier hours).','Ordering by phone causes a 2.7-minute longer wait.','The SD of wait times is 2.7 minutes.','Mobile orders are a random sample of all orders.'], a:0,
  e:'group 求平均只能显示两组的差别（association）。是否用手机下单不是随机分配的，可能和配料数量、下单时段等 confounders 有关，所以不能说是因果。'},
 ]});

patchCase('cs-study', {t:['tables'],
 tables:[{name:'study', cols:['student','section','hours','score','first_gen','prior_gpa'], rows:[['Ava','101','12.0','81','False','3.6'],['Ben','104','6.0','58','True','2.9'],['Chloe','102','15.0','77','False','3.8'],['Diego','101','9.0','73','True','3.3'],['Ella','103','3.0','49','False','2.7'],['Femi','104','10.5','69','True','3.1']], more:114}],
 cols:['student (str): first name','section (int): discussion section','hours (float): average weekly study hours','score (float): final exam score in percent','first_gen (bool): True if first-generation college student','prior_gpa (float): GPA before the course'],
 parts:[
 {l:'i', pts:3, k:'code', t:['residuals','tables'], q:"Add a column 'residual' with each student's residual, using the regression line from parts (a) and (b).", code:"study = study.with_column('residual', [A])",
  blanks:[{l:'A', acc:["study.column('score')-(1.8*study.column('hours')+52)","study.column('score')-(52+1.8*study.column('hours'))","study.column('score')-1.8*study.column('hours')-52"]}],
  e:'残差 = 实际值 − 预测值 = score − (1.8 × hours + 52)。数组运算对每一行同时进行。'},
 ]});

patchCase('cs-plants', {t:['tables','groups','causality'],
 tables:[
  {name:'plants', cols:['plant_id','bed','leaf_spots','yellow_pct','height_cm','blight'], rows:[['P01','B3','3','12.5','64.0','0'],['P02','B1','8','61.0','41.5','1'],['P03','B3','1','4.0','70.2','0'],['P04','B2','6','40.5','52.8','1'],['P05','B4','2','35.0','58.1','0'],['P06','B1','7','22.0','47.3','1']], more:194},
  {name:'beds', cols:['bed','sun','soil_ph','watering'], rows:[['B1','Partial','6.1','Drip'],['B2','Full','6.8','Hose'],['B3','Full','6.5','Drip'],['B4','Partial','7.2','Hose']], more:4}],
 cols:['plants.plant_id (str): plant label','plants.bed (str): garden bed','plants.leaf_spots (int): dark spots on the lowest leaf, 0 to 10','plants.yellow_pct (float): percent of leaf area that is yellow, 0 to 100','plants.height_cm (float): plant height in cm','plants.blight (int): 1 if the plant had blight, 0 otherwise','beds.bed (str): bed label (each bed appears once)','beds.sun (str): Full or Partial sun','beds.soil_ph (float): soil pH','beds.watering (str): Drip or Hose'],
 parts:[
 {l:'h', pts:4, k:'code', t:['groups','tables'], q:"Create a table with one row per sun level ('Full' or 'Partial') and the PROPORTION of plants with blight.", code:"plants.join([A]).select([B]).group([C])",
  blanks:[{l:'A', acc:["'bed',beds","'bed',beds,'bed'"]},{l:'B', acc:["'sun','blight'"]},{l:'C', acc:["'sun',np.mean","'sun',np.average"]}],
  e:'join 把每株植物所在花坛的日照信息带过来；blight 是 0/1，所以按 sun 分组后求平均就是患病比例。'},
 {l:'i', pts:2, k:'tf', t:['causality'], q:'True or False: If blight is more common in Partial-sun beds, this shows that partial sun causes blight.', a:false,
  e:'False。这是观察性数据，花坛不是随机分配日照的；Partial 的花坛在土壤 pH、浇水方式等方面也可能不同（confounders）。'},
 ]});

patchCase('cs-market', {t:['tables'],
 tables:[
  {name:'vendors', cols:['name','category','stall','organic','years'], rows:[['Sunny Acres','Produce','4','True','12'],['Rise Bakery','Bakery','11','False','3'],['Petal & Stem','Flowers','7','False','6'],['Green Row','Produce','2','True','1'],['Hearth Loaf','Bakery','9','True','8']], more:35},
  {name:'sales', cols:['stall','week','revenue','customers','rain'], rows:[['4','1','612.50','88','False'],['11','1','430.00','95','False'],['7','1','285.75','31','False'],['4','2','498.00','70','True'],['2','2','350.25','52','True']], more:475}],
 cols:['vendors.name (str): vendor name','vendors.category (str): Produce, Bakery, or Flowers','vendors.stall (int): stall number (one vendor per stall)','vendors.organic (bool): True if certified organic','vendors.years (int): years selling at this market','sales.stall (int): stall number','sales.week (int): week number, 1–12','sales.revenue (float): revenue that week, in dollars','sales.customers (int): number of customers that week','sales.rain (bool): True if it rained that Saturday'],
 parts:[
 {l:'h', pts:4, k:'code', t:['tables','groups'], q:'Create a table with two rows (rain True and False) and the average revenue PER CUSTOMER across all stall-weeks.', code:"sales.with_column('per', [A]).select([B]).group([C])",
  blanks:[{l:'A', acc:["sales.column('revenue')/sales.column('customers')"]},{l:'B', acc:["'rain','per'"]},{l:'C', acc:["'rain',np.mean","'rain',np.average"]}],
  e:'先用两列相除算出每个摊位每周的人均收入，再只留 rain 和 per，按 rain 求平均。'},
 {l:'i', pts:2, k:'code', t:['tables'], q:'Write an expression for the number of ORGANIC vendors in the Produce category.', code:"vendors.where([A]).where([B]).num_rows",
  blanks:[{l:'A', acc:["'organic',True","'organic',are.equal_to(True)"]},{l:'B', acc:["'category','Produce'","'category',are.equal_to('Produce')"]}],
  e:'两次 where 分别筛有机和类别，顺序可以互换；最后 num_rows（不加括号）数行数。'},
 ]});

patchCase('cs-ride', {t:['tables','groups'],
 tables:[{name:'train', cols:['trip_id','pickup','hour','miles','minutes','surge','fare'], rows:[['T1001','Berkeley','8','3.2','14','0','12.80'],['T1002','Oakland','18','7.9','25','1','34.10'],['T1003','Berkeley','22','1.1','6','0','7.25'],['T1004','Emeryville','17','12.4','31','0','29.95'],['T1005','Oakland','2','5.6','13','1','26.40'],['T1006','Albany','12','2.3','9','0','9.85']], more:3994}],
 cols:['trip_id (str): trip ID','pickup (str): city where the trip started','hour (int): hour of pickup (0–23)','miles (float): trip distance','minutes (float): trip duration','surge (int): 1 if surge pricing was on, 0 otherwise','fare (float): fare in dollars'],
 parts:[
 {l:'g', pts:4, k:'code', t:['groups','tables'], q:'Using train, make a table with one row per pickup city, one column for each surge value (0 and 1), and the AVERAGE fare in each cell.', code:"train.pivot([A], [B], [C], [D])",
  blanks:[{l:'A', acc:["'surge'"]},{l:'B', acc:["'pickup'"]},{l:'C', acc:["'fare'"]},{l:'D', acc:['np.mean','np.average']}],
  e:"pivot(变成列的, 变成行的, values, collect)：surge 的取值变成列，每个城市一行，格子里是 fare 的平均。"},
 ]});

patchCase('cs-survey', {t:['tables'],
 tables:[{name:'srs', cols:['student_id','Rating','Section','Year','Hours','Attended'], rows:[['s104','5','101','Senior','6.5','True'],['s221','3','104','Sophomore','9.0','False'],['s318','4','102','Junior','5.0','True'],['s442','4','107','Freshman','7.5','True'],['s517','2','101','Junior','12.0','False'],['s603','5','103','Sophomore','4.5','True']], more:94}],
 cols:['student_id (str): anonymized ID','Rating (int): overall rating from 1 to 5','Section (int): discussion section number','Year (str): class year','Hours (float): hours per week spent on the course','Attended (bool): True if the student regularly attended discussion'],
 parts:[
 {l:'g', pts:3, k:'code', t:['tables'], q:'Among students who regularly attended discussion, write an expression for the proportion who rated the course 4 or higher.', code:"np.mean(srs.where([A]).column([B]) >= 4)",
  blanks:[{l:'A', acc:["'Attended',True","'Attended',are.equal_to(True)"]},{l:'B', acc:["'Rating'"]}],
  e:'先筛出 Attended 为 True 的学生，再取 Rating 列和 4 比较，布尔数组的平均就是比例。'},
 {l:'h', pts:3, k:'mc', t:['causality'], q:'Students who attended discussion gave higher ratings on average. Which conclusion is best?', c:['There is an association, but students chose whether to attend; more motivated students may both attend and like the course more, so we cannot conclude attending causes higher ratings.','Attending discussion causes higher ratings, because the 100 students were a random sample.','There is no association because the ratings are on a 1–5 scale.','Discussion attendance should be required, since it raises ratings.'], a:0,
  e:'这 100 人是随机抽的（可以推广到全班），但“去不去讨论课”是学生自己选的，不是随机分配，所以只能说 association，有 confounding 的可能。'},
 ]});

Object.assign(CASES.find(c => c.id === 'cs-rent'), {
  bg: 'The student government surveys a simple random sample of 500 students who live off campus. The table rents has one row per surveyed student, with the monthly rent of their unit (column Rent) and other details about their housing. The sample median rent is $1,450, the sample mean is $1,520, and the sample SD is $410.',
  bgzh: '学生会随机抽取 500 名校外住宿的学生，表 rents 每行一个学生，包括房租（Rent）和住房的其他信息。样本中位数 1,450 美元，均值 1,520，标准差 410。'});
