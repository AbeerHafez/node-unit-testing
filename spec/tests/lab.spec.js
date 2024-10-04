const request = require("supertest");
const app = require("../..");
const { clearDatabase } = require("../../db.connection");

const req = request(app);

fdescribe("lab testing:", () => {

  let mockUser ,userToken,todoInDB ,userId;
  beforeAll(async() => {
    mockUser={name:"abeer",email:"abeer@asd.com",password:"1234"}
   await req.post("/user/signup").send(mockUser);

   userId= mockUser._id

   let res= await req.post("/user/login").send(mockUser)
    userToken= res.body.data

    let res2= await req.post("/todo").send({title:"eating breakfast"}).set({authorization:userToken})
    todoInDB=res2.body.data

  });

  describe("users routes:", () => {   
     // Note: user name must be sent in req query not req params

    it("req to get(/user/search) ,expect to get the correct user with his name", async () => {
      let res = await req.get("/user/search?name=" + mockUser.name);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(mockUser.name);
    });

    it("req to get(/user/search) with invalid name ,expect res status and res message to be as expected", async () => {
      let res = await req.get("/user/search?name=ali");
      expect(res.status).toBe(404);
      expect(res.body.message).toContain("There is no user with name: ");
    });
  });

  describe("todos routes:", () => {
    it("req to patch( /todo/) with id only ,expect res status and res message to be as expected", async () => {
      let res = await req.patch("/todo/" + todoInDB._id).send({}).set({ authorization: userToken });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "must provide title and id to edit todo"
      );
    });
    
    it("req to patch( /todo/) with id and title ,expect res status and res to be as expected", async () => {
      let newTitle = "New Todo Title";
      let res = await req.patch("/todo/" +todoInDB._id).send({ title: newTitle }).set({ authorization: userToken });;

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(newTitle);
    });

    it("req to get( /todo/user) ,expect to get all user's todos", async () => { 

      let res = await  req.get('/todo/user').set({authorization:userToken})
      expect(res.status).toBe(200)
      res.body.data.forEach(todo => {
        let todoUserId = todo.userId ? todo.userId.toString() : null;

        expect(todoUserId).toBe(userId);
      });
    })



    it("req to get( /todo/user) ,expect to not get any todos for user hasn't any todo", async () => {
      let newUser = { name: "newUser", email: "newuser@asd.com", password: "1234" };
      await req.post("/user/signup").send(newUser);
      let loginRes = await req.post("/user/login").send(newUser);
      let newUserToken = loginRes.body.data;
      let res = await req.get("/todo/user").set({ authorization: newUserToken });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Couldn't find any todos for")
     })
  });

  afterAll(async () => {
    await clearDatabase();
  });
});
