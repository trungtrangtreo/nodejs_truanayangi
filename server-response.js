module.exports = {
    response
}

function response(success,message)
{
    return {success:success,message:message};
}

function response(success,message,token)
{
    return {success:success,message:message,token:token};
}